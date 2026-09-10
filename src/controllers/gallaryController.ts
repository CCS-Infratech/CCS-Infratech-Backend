import { Request, Response } from 'express';
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { prisma } from '@/configs/db';
import multer from 'multer';
import { BUCKET_NAME, s3Client } from '@/utils/s3-utils';
import { controllerWrapper } from '@/utils/controllerWrapper';
import { routeParam } from '@/utils/helper';

/**
 * Get all galleries
 */
const getAllGalleriesHandler = async (req: Request, res: Response): Promise<void> => {
  const galleries = await prisma.gallery.findMany({
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: galleries,
  });
};

/**
 * Get all published galleries (where isActive is true)
 */
const getPublishedGalleriesHandler = async (req: Request, res: Response): Promise<void> => {
  const galleries = await prisma.gallery.findMany({
    where: {
      isActive: true,
    },
    include: {
      images: {
        take: 1,
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  res.status(200).json({
    success: true,
    data: galleries,
    count: galleries.length,
  });
};

/**
 * Get a gallery by slug
 */
const getGalleryByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);

  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!gallery) {
    res.status(404).json({
      success: false,
      message: 'Gallery not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: gallery,
  });
};

/**
 * Get a published gallery by ID
 */
const getPublishedGalleryByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);

  const gallery = await prisma.gallery.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!gallery) {
    res.status(404).json({
      success: false,
      message: 'Gallery not found or not published',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: gallery,
  });
};
/**
 * Create new Gallery
 */
const createGalleryHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, description, slug, isActive = true, images = [] } = req.body;

  if (!name || !slug) {
    res.status(400).json({
      success: false,
      message: 'Name and slug are required',
    });
    return;
  }

  // Check if slug already exists
  const existingGallery = await prisma.gallery.findUnique({
    where: { slug },
  });

  if (existingGallery) {
    res.status(400).json({
      success: false,
      message: 'A gallery with this slug already exists',
    });
    return;
  }

  // Create gallery with images
  const gallery = await prisma.gallery.create({
    data: {
      name,
      description: description || null,
      slug,
      isActive: !!isActive,
      images: {
        create: images.map((image: any, index: number) => ({
          url: image.url,
          filename: image.filename || `image-${index}`,
          alt: image.alt || '',
          caption: image.caption || '',
          sortOrder: image.sortOrder ?? index,
        })),
      },
    },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Gallery created successfully',
    data: gallery,
  });
};

/**
 * Update a gallery
 */
const updateGalleryHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);
  const { name, description, slug, isActive, images = [] } = req.body;

  // Check if gallery exists
  const existingGallery = await prisma.gallery.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existingGallery) {
    res.status(404).json({
      success: false,
      message: 'Gallery not found',
    });
    return;
  }

  // Check if the slug is already used by a different gallery
  if (slug && slug !== existingGallery.slug) {
    const slugExists = await prisma.gallery.findUnique({
      where: { slug },
    });

    if (slugExists) {
      res.status(400).json({
        success: false,
        message: 'A gallery with this slug already exists',
      });
      return;
    }
  }

  // Get existing image IDs for comparison
  const existingImageIds = existingGallery.images.map((img) => img.id);
  const newImageIds = images.filter((img: any) => img.id).map((img: any) => img.id);

  // Find images to delete (exists in DB but not in the request)
  const imagesToDelete = existingImageIds.filter((id) => !newImageIds.includes(id));

  // Transaction to ensure all operations complete or none do
  const gallery = await prisma.$transaction(async (tx) => {
    // 1. Update the gallery basic information
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updatedGallery = await tx.gallery.update({
      where: { id },
      data: updateData,
    });

    // 2. Delete images that are no longer in the array
    if (imagesToDelete.length > 0) {
      await tx.galleryImage.deleteMany({
        where: {
          id: { in: imagesToDelete },
          galleryId: id,
        },
      });
    }

    // 3. Process each image in the request
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (image.id && existingImageIds.includes(image.id)) {
        // Update existing image
        await tx.galleryImage.update({
          where: { id: image.id },
          data: {
            url: image.url,
            filename: image.filename,
            alt: image.alt || '',
            caption: image.caption || '',
            sortOrder: image.sortOrder ?? i,
          },
        });
      } else {
        // Create new image
        await tx.galleryImage.create({
          data: {
            url: image.url,
            filename: image.filename || `image-${i}`,
            alt: image.alt || '',
            caption: image.caption || '',
            sortOrder: image.sortOrder ?? i,
            galleryId: id,
          },
        });
      }
    }

    // Return the gallery with updated images
    return tx.gallery.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  });

  res.status(200).json({
    success: true,
    message: 'Gallery updated successfully',
    data: gallery,
  });
};

/**
 * Delete a gallery
 */
const deleteGalleryHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);

  // Check if gallery exists
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!gallery) {
    res.status(404).json({
      success: false,
      message: 'Gallery not found',
    });
    return;
  }

  // Optionally delete images from S3 as well
  for (const image of gallery.images) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: image.filename,
        })
      );
    } catch (error) {
      console.error(`Failed to delete image ${image.filename} from S3:`, error);
      // Continue with deletion even if S3 delete fails
    }
  }

  // Delete gallery (will cascade delete images from DB due to onDelete: Cascade)
  await prisma.gallery.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Gallery deleted successfully',
  });
};

/**
 * Delete an image from a gallery
 */
const deleteGalleryImageHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);

  // Check if image exists
  const image = await prisma.galleryImage.findUnique({
    where: { id },
  });

  if (!image) {
    res.status(404).json({
      success: false,
      message: 'Image not found',
    });
    return;
  }

  // Delete the image
  await prisma.galleryImage.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
};

// Export all controllers with controllerWrapper
export const getAllGalleries = controllerWrapper(getAllGalleriesHandler);
export const getPublishedGalleries = controllerWrapper(getPublishedGalleriesHandler);
export const getGalleryById = controllerWrapper(getGalleryByIdHandler);
export const getPublishedGalleryById = controllerWrapper(getPublishedGalleryByIdHandler);
export const createGallery = controllerWrapper(createGalleryHandler);
export const updateGallery = controllerWrapper(updateGalleryHandler);
export const deleteGallery = controllerWrapper(deleteGalleryHandler);
export const deleteGalleryImage = controllerWrapper(deleteGalleryImageHandler);
