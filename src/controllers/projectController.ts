import { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { prisma } from '@/configs/db';
import { BUCKET_NAME, s3Client } from '@/utils/s3-utils';
import { controllerWrapper } from '@/utils/controllerWrapper';
import slugify from 'slugify';
import { validate as isUuid } from 'uuid';
import { processContentImages } from '@/utils/helper';

/**
 * Create a new project
 */
const createProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    description,
    clientName,
    projectUrl,
    logoUrl,
    content,
    status,
    completionDate,
    featured,
    published,
    overviewHeadline,
    overviewDescription,
    location,
    sitePlanHeadline,
    sitePlanImage,
    sitePlanBrochureUrl,
    currentPlanHeadline,
    currentPlanImage,
    currentPlanBrochureUrl,
    unitPlanHeadline,
    unitPlanImage,
    unitPlanBrochureUrl,
    mapUrl,
    nearbyAttractions,
    locationDetails,
    specifications,
    amenities,
    images, // Gallery images from frontend
  } = req.body;

  // Get the user ID from the authenticated user
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Generate a slug from the title
  let slug = slugify(title, { lower: true, strict: true });

  // Check if slug already exists
  const existingSlug = await prisma.project.findUnique({
    where: { slug },
  });

  // Add random suffix if slug exists
  if (existingSlug) {
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
  }

  // Process inline images in content if provided
  let processedContent = content;
  let extractedImages: any[] = [];

  if (content) {
    const processed = await processContentImages(content);
    processedContent = processed.processedContent;
    extractedImages = processed.extractedImages;
  }

  // Create the project and related data in a transaction
  const project = await prisma.$transaction(async (tx) => {
    // Build project data object conditionally
    const projectData: any = {
      title,
      slug,
      description,
      featured: !!featured,
      published: !!published,
      authorId: userId,
    };

    // Add optional fields only if they exist
    if (clientName) projectData.clientName = clientName;
    if (projectUrl) projectData.projectUrl = projectUrl;
    if (logoUrl) projectData.logoUrl = logoUrl;
    if (processedContent) projectData.content = processedContent;
    if (status) projectData.status = status;
    if (completionDate) projectData.completionDate = new Date(completionDate);
    if (published) projectData.publishedAt = new Date();
    if (overviewHeadline) projectData.overviewHeadline = overviewHeadline;
    if (overviewDescription) projectData.overviewDescription = overviewDescription;
    if (location) projectData.location = location;
    if (sitePlanHeadline) projectData.sitePlanHeadline = sitePlanHeadline;
    if (sitePlanImage) projectData.sitePlanImage = sitePlanImage;
    if (sitePlanBrochureUrl) projectData.sitePlanBrochureUrl = sitePlanBrochureUrl;
    if (currentPlanHeadline) projectData.currentPlanHeadline = currentPlanHeadline;
    if (currentPlanImage) projectData.currentPlanImage = currentPlanImage;
    if (currentPlanBrochureUrl) projectData.currentPlanBrochureUrl = currentPlanBrochureUrl;
    if (unitPlanHeadline) projectData.unitPlanHeadline = unitPlanHeadline;
    if (unitPlanImage) projectData.unitPlanImage = unitPlanImage;
    if (unitPlanBrochureUrl) projectData.unitPlanBrochureUrl = unitPlanBrochureUrl;
    if (mapUrl) projectData.mapUrl = mapUrl;
    if (nearbyAttractions) projectData.nearbyAttractions = nearbyAttractions;
    if (locationDetails) projectData.locationDetails = locationDetails;

    // Create the project
    const newProject = await tx.project.create({
      data: projectData,
    });

    // Combine extracted images (from content) and gallery images (from frontend)
    const allImages = [...extractedImages];

    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((img, index) => {
        allImages.push({
          url: img.url,
          filename: img.filename,
          alt: img.alt || '',
          caption: img.caption || '',
          isFeatured: img.isFeatured || false,
          displayOrder:
            img.displayOrder !== undefined ? img.displayOrder : extractedImages.length + index,
        });
      });
    }

    // Create image records for all images
    if (allImages.length > 0) {
      await tx.projectImage.createMany({
        data: allImages.map((image) => ({
          projectId: newProject.id,
          url: image.url,
          filename: image.filename,
          alt: image.alt || '',
          caption: image.caption || '',
          isFeatured: image.isFeatured || false,
          displayOrder: image.displayOrder,
        })),
      });
    }

    // Create specifications if provided
    if (specifications && Array.isArray(specifications) && specifications.length > 0) {
      await tx.projectSpecification.createMany({
        data: specifications.map((spec, index) => ({
          projectId: newProject.id,
          title: spec.title,
          description: spec.description,
          imageUrl: spec.imageUrl || null,
          displayOrder: index,
        })),
      });
    }

    // Create amenities if provided
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      await tx.projectAmenity.createMany({
        data: amenities.map((amenity, index) => ({
          projectId: newProject.id,
          name: amenity.name,
          imageUrl: amenity.imageUrl || null,
          displayOrder: index,
        })),
      });
    }

    return newProject;
  });

  // Fetch the complete project with related data
  const projectWithDetails = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      specifications: {
        orderBy: { displayOrder: 'asc' },
      },
      amenities: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: projectWithDetails,
  });
};
/**
 * Get all projects with optional filtering
 */
const getProjectsHandler = async (req: Request, res: Response): Promise<void> => {
  const { published, featured, authorId, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build filter conditions
  const where: any = {};

  if (published !== undefined) {
    where.published = published === 'true';
  }

  if (featured !== undefined) {
    where.featured = featured === 'true';
  }

  if (authorId) {
    where.authorId = String(authorId);
  }

  // Get total count for pagination
  const total = await prisma.project.count({ where });

  // Get projects with author information and featured image
  const projects = await prisma.project.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      images: {
        where: {
          isFeatured: true,
        },
        take: 1,
      },
      _count: {
        select: {
          specifications: true,
          amenities: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: Number(limit),
  });

  // If no featured image was found, get the first image for each project
  for (const project of projects) {
    if (project.images.length === 0) {
      const firstImage = await prisma.projectImage.findFirst({
        where: {
          projectId: project.id,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      if (firstImage) {
        project.images = [firstImage];
      }
    }
  }

  res.status(200).json({
    success: true,
    data: projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

/**
 * Get published projects with optional filtering
 */
const getPublishedProjectsHandler = async (req: Request, res: Response): Promise<void> => {
  const { featured, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { published: true };
  if (featured !== undefined) {
    where.featured = featured === 'true';
  }

  // Use a transaction to ensure count and data are consistent
  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        images: {
          orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
          take: 1,
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: projects,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  });
};

/**
 * Get a single project by ID or slug
 */
const getProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const project = await prisma.project.update({
      where: {
        id,
        published: true,
      },
      data: {
        viewCount: { increment: 1 },
      },
      select: {
        id: true,
        title: true,
        published: true,
        slug: true,
        description: true,
        content: true,
        logoUrl: true,
        status: true,
        completionDate: true,
        featured: true,
        publishedAt: true,
        location: true,
        overviewHeadline: true,
        overviewDescription: true,
        sitePlanHeadline: true,
        sitePlanImage: true,
        sitePlanBrochureUrl: true,
        currentPlanHeadline: true,
        currentPlanImage: true,
        currentPlanBrochureUrl: true,
        unitPlanHeadline: true,
        unitPlanImage: true,
        unitPlanBrochureUrl: true,
        mapUrl: true,
        nearbyAttractions: true,
        locationDetails: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        specifications: {
          orderBy: { displayOrder: 'asc' },
        },
        amenities: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Project not found or is not currently published',
    });
  }
};

/**
 * Get a single project by ID or slug
 */
const getPublishedProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const { identifier } = req.params;

  // Determine if the identifier is an ID (UUID) or slug
  const isId = isUuid(identifier);

  // Build where clause - only published projects
  const where: any = {
    published: true,
  };

  // Add ID or slug condition
  if (isId) {
    where.id = identifier;
  } else {
    where.slug = identifier;
  }

  // Get the project with all related data
  const project = await prisma.project.findFirst({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      logoUrl: true,
      status: true,
      completionDate: true,
      featured: true,
      publishedAt: true,
      location: true,
      overviewHeadline: true,
      overviewDescription: true,
      sitePlanHeadline: true,
      sitePlanImage: true,
      sitePlanBrochureUrl: true,
      currentPlanHeadline: true,
      currentPlanImage: true,
      currentPlanBrochureUrl: true,
      unitPlanHeadline: true,
      unitPlanImage: true,
      unitPlanBrochureUrl: true,
      mapUrl: true,
      nearbyAttractions: true,
      locationDetails: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      images: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      specifications: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      amenities: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });

  if (!project) {
    res.status(404).json({
      success: false,
      message: 'Project not found or not published',
    });
    return;
  }

  // Increment view count
  await prisma.project.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  });

  res.status(200).json({
    success: true,
    data: project,
  });
};

/**
 * Update a project
 */
const updateProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    title,
    description,
    clientName,
    projectUrl,
    logoUrl,
    content,
    status,
    completionDate,
    featured,
    published,
    overviewHeadline,
    overviewDescription,
    location,
    sitePlanHeadline,
    sitePlanImage,
    sitePlanBrochureUrl,
    currentPlanHeadline,
    currentPlanImage,
    currentPlanBrochureUrl,
    unitPlanHeadline,
    unitPlanImage,
    unitPlanBrochureUrl,
    mapUrl,
    nearbyAttractions,
    locationDetails,
    specifications,
    amenities,
    images, // Gallery images
  } = req.body;

  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Check if project exists and belongs to the user
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    res.status(404).json({
      success: false,
      message: 'Project not found',
    });
    return;
  }

  // Check if user is the author or an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (project.authorId !== userId && user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to update this project',
    });
    return;
  }

  // Prepare update data
  const updateData: any = {};

  // Process title and slug if provided
  if (title) {
    updateData.title = title;

    // Update slug if title changes
    let newSlug = slugify(title, { lower: true, strict: true });

    // Check if new slug already exists and is not the current project
    const existingSlug = await prisma.project.findFirst({
      where: {
        slug: newSlug,
        id: { not: id },
      },
    });

    // Add random suffix if slug exists
    if (existingSlug) {
      newSlug = `${newSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    updateData.slug = newSlug;
  }

  // Add optional fields to update data
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (clientName !== undefined) updateData.clientName = clientName;
  if (projectUrl !== undefined) updateData.projectUrl = projectUrl;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (completionDate !== undefined)
    updateData.completionDate = completionDate ? new Date(completionDate) : null;
  if (featured !== undefined) updateData.featured = !!featured;

  // Handle publish status change
  if (published !== undefined) {
    updateData.published = !!published;

    // Set publishedAt only when first published
    if (published && !project.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  // Add overview fields
  if (overviewHeadline !== undefined) updateData.overviewHeadline = overviewHeadline;
  if (overviewDescription !== undefined) updateData.overviewDescription = overviewDescription;
  if (location !== undefined) updateData.location = location;

  // Add plan fields
  if (sitePlanHeadline !== undefined) updateData.sitePlanHeadline = sitePlanHeadline;
  if (sitePlanImage !== undefined) updateData.sitePlanImage = sitePlanImage;
  if (sitePlanBrochureUrl !== undefined) updateData.sitePlanBrochureUrl = sitePlanBrochureUrl;
  if (currentPlanHeadline !== undefined) updateData.currentPlanHeadline = currentPlanHeadline;
  if (currentPlanImage !== undefined) updateData.currentPlanImage = currentPlanImage;
  if (currentPlanBrochureUrl !== undefined)
    updateData.currentPlanBrochureUrl = currentPlanBrochureUrl;
  if (unitPlanHeadline !== undefined) updateData.unitPlanHeadline = unitPlanHeadline;
  if (unitPlanImage !== undefined) updateData.unitPlanImage = unitPlanImage;
  if (unitPlanBrochureUrl !== undefined) updateData.unitPlanBrochureUrl = unitPlanBrochureUrl;

  // Add location fields
  if (mapUrl !== undefined) updateData.mapUrl = mapUrl;
  if (nearbyAttractions !== undefined) updateData.nearbyAttractions = nearbyAttractions;
  if (locationDetails !== undefined) updateData.locationDetails = locationDetails;

  // Process content and images if provided
  let extractedImages: any[] = [];
  if (content) {
    const processed = await processContentImages(content);
    updateData.content = processed.processedContent;
    extractedImages = processed.extractedImages;
  }

  // Update the project and related data in a transaction
  const updatedProject = await prisma.$transaction(async (tx) => {
    // Update the project
    const updated = await tx.project.update({
      where: { id },
      data: updateData,
    });

    // Handle images (both extracted from content and gallery images)
    if (content || (images && Array.isArray(images))) {
      // Get existing images
      const existingImages = await tx.projectImage.findMany({
        where: { projectId: id },
      });

      // Extract URLs from existing images
      const existingUrls = new Set(existingImages.map((img) => img.url));

      // Combine extracted images and gallery images
      const allNewImages = [...extractedImages];

      if (images && Array.isArray(images) && images.length > 0) {
        images.forEach((img, index) => {
          if (!existingUrls.has(img.url)) {
            allNewImages.push({
              url: img.url,
              filename: img.filename,
              alt: img.alt || '',
              caption: img.caption || '',
              isFeatured: img.isFeatured || false,
              displayOrder:
                img.displayOrder !== undefined ? img.displayOrder : existingImages.length + index,
            });
          }
        });
      }

      // Add new images to the database
      if (allNewImages.length > 0) {
        await tx.projectImage.createMany({
          data: allNewImages.map((image, index) => ({
            projectId: id,
            url: image.url,
            filename: image.filename,
            alt: image.alt || '',
            caption: image.caption || '',
            isFeatured: image.isFeatured || false,
            displayOrder:
              image.displayOrder !== undefined ? image.displayOrder : existingImages.length + index,
          })),
        });
      }
    }

    // Update specifications if provided
    if (specifications && Array.isArray(specifications)) {
      // Delete existing specifications
      await tx.projectSpecification.deleteMany({
        where: { projectId: id },
      });

      // Create new specifications
      if (specifications.length > 0) {
        await tx.projectSpecification.createMany({
          data: specifications.map((spec, index) => ({
            projectId: id,
            title: spec.title,
            description: spec.description,
            imageUrl: spec.imageUrl || null,
            displayOrder: index,
          })),
        });
      }
    }

    // Update amenities if provided
    if (amenities && Array.isArray(amenities)) {
      // Delete existing amenities
      await tx.projectAmenity.deleteMany({
        where: { projectId: id },
      });

      // Create new amenities
      if (amenities.length > 0) {
        await tx.projectAmenity.createMany({
          data: amenities.map((amenity, index) => ({
            projectId: id,
            name: amenity.name,
            imageUrl: amenity.imageUrl || null,
            displayOrder: index,
          })),
        });
      }
    }

    return updated;
  });

  // Fetch the complete updated project with related data
  const projectWithDetails = await prisma.project.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      specifications: {
        orderBy: { displayOrder: 'asc' },
      },
      amenities: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: projectWithDetails,
  });
};

/**
 * Delete a project
 */
const deleteProjectHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Check if project exists and belongs to the user
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    res.status(404).json({
      success: false,
      message: 'Project not found',
    });
    return;
  }

  // Check if user is the author or an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (project.authorId !== userId && user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this project',
    });
    return;
  }

  // Delete the project (related data will be cascade deleted)
  await prisma.project.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
};

// Wrap all handlers with the controller wrapper
export const createProject = controllerWrapper(createProjectHandler);
export const getProjects = controllerWrapper(getProjectsHandler);
export const getPublishedProjects = controllerWrapper(getPublishedProjectsHandler);
export const getProject = controllerWrapper(getProjectHandler);
export const getPublishedProject = controllerWrapper(getPublishedProjectHandler);
export const updateProject = controllerWrapper(updateProjectHandler);
export const deleteProject = controllerWrapper(deleteProjectHandler);
