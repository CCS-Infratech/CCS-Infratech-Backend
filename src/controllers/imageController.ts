import { Request, Response } from 'express';
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { prisma } from '@/configs/db';
import { BUCKET_NAME, s3Client } from '@/utils/s3-utils';
import multer from 'multer';
import { routeParam } from '@/utils/helper';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 70 * 1024 * 1024,
  },
}).single('file');

/**
 * Upload an image to S3
 */
const uploadToS3 = async (file: Buffer, filename: string, contentType: string) => {
  const key = `blogs/${Date.now()}-${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return {
    url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
    key: key,
  };
};

/**
 * Upload an image or PDF to S3 and save to database
 */
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  console.log('Upload media endpoint hit');

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    try {
      const contentType = req.file.mimetype;
      let uploadResult;

      // Handle PDF files differently from images
      if (contentType === 'application/pdf') {
        // For PDFs, upload directly without processing
        const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, contentType);

        uploadResult = {
          success: true,
          url: url,
          key: key,
          bytes: req.file.buffer.length,
          format: 'pdf',
          display_name: req.file.originalname.split('.')[0],
          type: 'pdf',
        };
      } else if (contentType.startsWith('image/')) {
        // Process images as before
        const imageBuffer = req.file.buffer;
        const imageInfo = await sharp(imageBuffer).metadata();

        // Optimize image while maintaining quality
        let processedImage = sharp(imageBuffer);
        const MAX_WIDTH = 1920; // Maximum width to maintain good quality

        // Only resize if the image is larger than MAX_WIDTH
        if (imageInfo.width && imageInfo.width > MAX_WIDTH) {
          processedImage = processedImage.resize({
            width: MAX_WIDTH,
            withoutEnlargement: true, // Don't enlarge smaller images
            fit: 'inside', // Maintain aspect ratio
          });
        }

        // Optimize based on original format
        let optimizedBuffer;

        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          optimizedBuffer = await processedImage.jpeg({ quality: 85 }).toBuffer();
        } else if (contentType.includes('png')) {
          optimizedBuffer = await processedImage.png({ compressionLevel: 9 }).toBuffer();
        } else if (contentType.includes('webp')) {
          optimizedBuffer = await processedImage.webp({ quality: 85 }).toBuffer();
        } else {
          // For other formats, use original buffer
          optimizedBuffer = await processedImage.toBuffer();
        }

        // Get updated metadata for the processed image
        const optimizedInfo = await sharp(optimizedBuffer).metadata();

        const { url, key } = await uploadToS3(optimizedBuffer, req.file.originalname, contentType);

        uploadResult = {
          success: true,
          url: url,
          key: key,
          bytes: optimizedBuffer.length,
          format: contentType.split('/')[1],
          display_name: req.file.originalname.split('.')[0],
          width: optimizedInfo.width || 0,
          height: optimizedInfo.height || 0,
          type: 'image',
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Please upload an image or PDF file.',
        });
      }

      res.status(200).json(uploadResult);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: error.message,
      });
    }
  });
};

/**
 * Get all images
 */
export const getImages = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all blog images
    const blogImages = await prisma.blogImage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format for media library
    const formattedImages = blogImages.map((img) => ({
      id: img.id,
      url: img.url,
      created_at: img.createdAt.toISOString(),
      format: img.filename.split('.').pop() || 'jpg',
      display_name: img.alt || 'Image',
      width: 0,
      height: 0,
      filename: img.filename,
    }));

    res.status(200).json(formattedImages);
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: error.message,
    });
  }
};

/**
 * Delete an image
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageId = routeParam(req.params.id);

    await prisma.blogImage.delete({
      where: {
        id: imageId,
      },
    });

    // Note: This doesn't delete from S3 - you might want to add that functionality

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
};

/**
 * Get images directly from S3
 */
export const getS3Images = async (req: Request, res: Response): Promise<void> => {
  try {
    const prefix = 'blogs/';

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      res.status(200).json([]);
      return;
    }

    // Format the response
    // Fix the URL to include region
    const s3Images = response.Contents.map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
    }));

    console.log('Fetched S3 images:', s3Images);

    res.status(200).json(s3Images);
  } catch (error: any) {
    console.error('Error fetching S3 images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch S3 images',
      error: error.message,
    });
  }
};

/**
 * Delete an image directly from S3 by key
 */
export const deleteS3Image = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;

    if (!key) {
      res.status(400).json({
        success: false,
        message: 'S3 key is required',
      });
      return;
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully from S3',
    });
  } catch (error: any) {
    console.error('Error deleting S3 image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete S3 image',
      error: error.message,
    });
  }
};
