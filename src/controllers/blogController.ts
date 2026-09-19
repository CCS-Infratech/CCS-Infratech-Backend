import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';
import slugify from 'slugify';
import { validate as isUuid } from 'uuid';
import { processContentImages, routeParam } from '@/utils/helper';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

function normalizeCoverImageUrl(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return String(value);
}

async function syncCoverImage(
  client: PrismaLike,
  blogId: string,
  coverImageUrl: string | null | undefined,
  alt = ''
): Promise<void> {
  if (coverImageUrl === undefined) {
    return;
  }

  const existing = await client.blogImage.findFirst({
    where: { blogId },
    orderBy: { sortOrder: 'asc' },
  });

  if (!coverImageUrl) {
    if (existing) {
      await client.blogImage.delete({
        where: { id: existing.id },
      });
    }
    return;
  }

  const filename = coverImageUrl.split('/').pop() || 'cover';

  if (existing) {
    await client.blogImage.update({
      where: { id: existing.id },
      data: {
        url: coverImageUrl,
        filename,
        alt,
      },
    });
    return;
  }

  await client.blogImage.create({
    data: {
      blogId,
      url: coverImageUrl,
      filename,
      alt,
      caption: '',
      sortOrder: 0,
    },
  });
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Create a new blog post
 */
const createBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const { title, content, summary, published, coverImageUrl } = req.body;
  const coverUrl = normalizeCoverImageUrl(coverImageUrl);

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
  const existingSlug = await prisma.blog.findUnique({
    where: { slug },
  });

  // Add random suffix if slug exists
  if (existingSlug) {
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
  }

  // Process inline images in content
  const { processedContent, extractedImages } = await processContentImages(content);

  // Create the blog post and images in a transaction
  const blog = await prisma.$transaction(async (tx) => {
    // Create the blog post with processed content
    const newBlog = await tx.blog.create({
      data: {
        title,
        slug,
        content: processedContent, // Content with updated image URLs
        summary: summary || null,
        published: !!published,
        publishedAt: published ? new Date() : null,
        authorId: userId,
      },
    });

    await syncCoverImage(tx, newBlog.id, coverUrl, title);

    const contentImages = extractedImages.filter((image) => image.url !== coverUrl);

    if (contentImages.length > 0) {
      await tx.blogImage.createMany({
        data: contentImages.map((image, index) => ({
          blogId: newBlog.id,
          url: image.url,
          filename: image.filename,
          alt: image.alt || '',
          caption: image.caption || '',
          sortOrder: (coverUrl ? 1 : 0) + index,
        })),
      });
    }

    return newBlog;
  });

  // Fetch the complete blog with images
  const blogWithImages = await prisma.blog.findUnique({
    where: { id: blog.id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Blog post created successfully',
    data: blogWithImages,
  });
};

/**
 * Get all blog posts with optional filtering
 */
const getBlogsHandler = async (req: Request, res: Response): Promise<void> => {
  const { published, authorId, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // Build filter conditions
  const where: any = {};

  if (published !== undefined) {
    where.published = published === 'true';
  }

  if (authorId) {
    where.authorId = String(authorId);
  }

  // Get total count for pagination
  const total = await prisma.blog.count({ where });

  // Get blogs with author information
  const blogs = await prisma.blog.findMany({
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
        orderBy: {
          sortOrder: 'asc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: Number(limit),
  });
  console.log(blogs);

  res.status(200).json({
    success: true,
    data: blogs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

/**
 * Get all blog posts with optional filtering
 */
const getPublusedBlogsHandler = async (req: Request, res: Response): Promise<void> => {
  const { published, authorId, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    published: true,
  };

  if (published !== undefined) {
    where.published = published === 'true';
  }

  if (authorId) {
    where.authorId = String(authorId);
  }

  // Get total count for pagination
  const total = await prisma.blog.count({ where });

  // Get blogs with author information
  const blogs = await prisma.blog.findMany({
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
        orderBy: {
          sortOrder: 'asc',
        },
        take: 1,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    skip,
    take: Number(limit),
  });
  console.log(blogs);

  res.status(200).json({
    success: true,
    data: blogs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

/**
 * Get a single blog post by ID or slug
 */
const getBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const identifier = routeParam(req.params.identifier);

  // Determine if the identifier is an ID (UUID) or slug
  const isId = isUuid(identifier);

  const where = isId ? { id: identifier } : { slug: identifier };

  // Get the blog with author and images
  const blog = await prisma.blog.findUnique({
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
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
  console.log(blog);
  if (!blog) {
    res.status(404).json({
      success: false,
      message: 'Blog post not found',
    });
    return;
  }

  // Increment view count for published blogs only
  if (blog.published) {
    await prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  res.status(200).json({
    success: true,
    data: blog,
  });
};

/**
 * Update a blog post
 */
const updateBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);
  const { title, content, summary, published, coverImageUrl } = req.body;
  const coverUrl = normalizeCoverImageUrl(coverImageUrl);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Check if blog exists and belongs to the user
  const blog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!blog) {
    res.status(404).json({
      success: false,
      message: 'Blog post not found',
    });
    return;
  }

  // Check if user is the author or an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (blog.authorId !== userId && user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to update this blog post',
    });
    return;
  }

  // Prepare update data
  const updateData: any = {};

  if (title) {
    updateData.title = title;

    // Update slug if title changes
    let newSlug = slugify(title, { lower: true, strict: true });

    // Check if new slug already exists and is not the current blog
    const existingSlug = await prisma.blog.findFirst({
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

  // Process images if content is provided
  if (content) {
    // Process inline images in content
    const { processedContent, extractedImages } = await processContentImages(content);
    updateData.content = processedContent;

    // Update the blog and images in a transaction
    const updatedBlog = await prisma.$transaction(async (tx) => {
      // Update the blog post with processed content
      const updated = await tx.blog.update({
        where: { id },
        data: {
          ...updateData,
          summary: summary !== undefined ? summary : blog.summary,
          published: published !== undefined ? published : blog.published,
          publishedAt: published && !blog.publishedAt ? new Date() : blog.publishedAt,
        },
      });

      // Get existing images
      const existingImages = await tx.blogImage.findMany({
        where: { blogId: id },
      });

      // Extract URLs from existing images
      const existingUrls = new Set(existingImages.map((img) => img.url));

      // Filter out images that are already in the database
      const newImages = extractedImages.filter((img) => !existingUrls.has(img.url));

      // Add new images to the database
      if (newImages.length > 0) {
        await tx.blogImage.createMany({
          data: newImages.map((image, index) => ({
            blogId: id,
            url: image.url,
            filename: image.filename,
            alt: image.alt || '',
            caption: image.caption || '',
            sortOrder: existingImages.length + index,
          })),
        });
      }

      await syncCoverImage(tx, id, coverUrl, title || blog.title);

      return updated;
    });

    // Fetch the complete blog with images
    const blogWithImages = await prisma.blog.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: blogWithImages,
    });
    return;
  } else {
    // If no content update, just update other fields
    if (summary !== undefined) updateData.summary = summary;

    // Handle publish status change
    if (published !== undefined) {
      updateData.published = published;

      // Set publishedAt only when first published
      if (published && !blog.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    await syncCoverImage(prisma, id, coverUrl, title || blog.title);

    const blogWithImages = await prisma.blog.findUnique({
      where: { id: updatedBlog.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: blogWithImages,
    });
  }
};

/**
 * Delete a blog post
 */
const deleteBlogHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Check if blog exists and belongs to the user
  const blog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!blog) {
    res.status(404).json({
      success: false,
      message: 'Blog post not found',
    });
    return;
  }

  // Check if user is the author or an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (blog.authorId !== userId && user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this blog post',
    });
    return;
  }

  // Delete the blog (related images will be cascade deleted)
  await prisma.blog.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Blog post deleted successfully',
  });
};

/**
 * Upload blog images
 */
const uploadBlogImagesHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  // Check if blog exists and belongs to the user
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!blog) {
    res.status(404).json({
      success: false,
      message: 'Blog post not found',
    });
    return;
  }

  // Check if user is the author or an admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (blog.authorId !== userId && user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to upload images to this blog post',
    });
    return;
  }

  // Get uploaded files from middleware like multer
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
    return;
  }

  // Create image records
  const images = await Promise.all(
    files.map(async (file, index) => {
      return prisma.blogImage.create({
        data: {
          blogId: id,
          filename: file.filename,
          url: `/uploads/blogs/${file.filename}`,
          alt: blog.title || '',
          caption: '',
          sortOrder: blog.images.length + index,
        },
      });
    })
  );

  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    data: images,
  });
};

// Wrap all handlers with the controller wrapper
export const createBlog = controllerWrapper(createBlogHandler);
export const getBlogs = controllerWrapper(getBlogsHandler);
export const getBlog = controllerWrapper(getBlogHandler);
export const getPublisedBlogs = controllerWrapper(getPublusedBlogsHandler);
export const updateBlog = controllerWrapper(updateBlogHandler);
export const deleteBlog = controllerWrapper(deleteBlogHandler);
export const uploadBlogImages = controllerWrapper(uploadBlogImagesHandler);
