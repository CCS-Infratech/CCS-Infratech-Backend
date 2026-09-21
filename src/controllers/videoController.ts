import { Request, Response } from 'express';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BUCKET_NAME, s3Client } from '@/utils/s3-utils';

/**
 * Video uploads do not go through this server.
 *
 * The admin asks for a short-lived, pre-signed S3 URL and then PUTs the
 * file straight to the bucket from the browser. That keeps large videos
 * out of the API's memory and away from any request body size limit.
 */

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
  'video/x-m4v',
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
];

// Hard ceiling for a single walkthrough video.
const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1 GB

// How long the signed upload URL stays valid.
const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes

const S3_PREFIX = 'walkthroughs/videos';

/**
 * Turn the original file name into something safe for an S3 key.
 */
const buildObjectKey = (originalName: string): string => {
  const cleanName = (originalName || 'video')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-120);

  return `${S3_PREFIX}/${Date.now()}-${cleanName || 'video'}`;
};

const buildPublicUrl = (key: string): string => {
  const region = process.env.AWS_REGION;

  return region
    ? `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

/**
 * Create a pre-signed PUT URL the admin can upload a video to.
 */
export const createVideoUploadUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { filename, contentType, size } = req.body ?? {};

    if (!filename || typeof filename !== 'string') {
      res.status(400).json({
        success: false,
        message: 'filename is required',
      });
      return;
    }

    if (!contentType || typeof contentType !== 'string') {
      res.status(400).json({
        success: false,
        message: 'contentType is required',
      });
      return;
    }

    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      res.status(400).json({
        success: false,
        message: `Unsupported video type "${contentType}". Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      });
      return;
    }

    const fileSize = Number(size);

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      res.status(400).json({
        success: false,
        message: 'A valid file size is required',
      });
      return;
    }

    if (fileSize > MAX_VIDEO_SIZE) {
      res.status(400).json({
        success: false,
        message: `Video is too large. The limit is ${MAX_VIDEO_SIZE / (1024 * 1024)} MB.`,
      });
      return;
    }

    if (!BUCKET_NAME) {
      res.status(500).json({
        success: false,
        message: 'S3 bucket is not configured on the server',
      });
      return;
    }

    const key = buildObjectKey(filename);

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // `@aws-sdk/s3-request-presigner` and `@aws-sdk/client-s3` can resolve to
    // different copies of `@smithy/types`, which makes TypeScript treat the
    // two S3Client types as unrelated. It is the same object at runtime, so
    // the cast is confined to this one call.
    const uploadUrl = await getSignedUrl(
      s3Client as unknown as Parameters<typeof getSignedUrl>[0],
      putCommand as unknown as Parameters<typeof getSignedUrl>[1],
      { expiresIn: SIGNED_URL_TTL_SECONDS }
    );

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        key,
        publicUrl: buildPublicUrl(key),
        expiresIn: SIGNED_URL_TTL_SECONDS,
      },
    });
  } catch (error: any) {
    console.error('Error creating video upload URL:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create video upload URL',
      error: error.message,
    });
  }
};

/**
 * List the videos already uploaded to S3, newest first.
 *
 * Used by the admin's "Media Library" tab so an existing video can be
 * reused on another walkthrough instead of uploading it again.
 */
export const listVideos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!BUCKET_NAME) {
      res.status(500).json({
        success: false,
        message: 'S3 bucket is not configured on the server',
      });
      return;
    }

    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${S3_PREFIX}/`,
      })
    );

    const videos = (response.Contents ?? [])
      // A "folder" placeholder object has no real content.
      .filter((item) => item.Key && item.Size && item.Key !== `${S3_PREFIX}/`)
      .map((item) => {
        const key = item.Key as string;
        const filename = key.split('/').pop() || key;

        return {
          key,
          url: buildPublicUrl(key),
          filename,
          // Strip the timestamp we prefix at upload time.
          displayName: filename.replace(/^\d{13}-/, ''),
          size: item.Size ?? 0,
          lastModified: item.LastModified,
        };
      })
      .sort((a, b) => {
        const left = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const right = b.lastModified ? new Date(b.lastModified).getTime() : 0;

        return right - left;
      });

    res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error: any) {
    console.error('Error listing videos:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to list videos',
      error: error.message,
    });
  }
};

/**
 * Delete a previously uploaded video from S3 by its key.
 */
export const deleteVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const key = req.query.key as string;

    if (!key) {
      res.status(400).json({
        success: false,
        message: 'S3 key is required',
      });
      return;
    }

    if (!key.startsWith(`${S3_PREFIX}/`)) {
      res.status(400).json({
        success: false,
        message: 'Only walkthrough video objects can be deleted here',
      });
      return;
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting video:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message,
    });
  }
};
