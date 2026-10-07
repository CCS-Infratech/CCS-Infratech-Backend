import { Request, Response } from 'express';
import { prisma } from '@/configs/db';

/**
 * GET /api/v1/testimonials
 *
 * Public endpoint.
 * Returns only active testimonials ordered by sortOrder.
 */
export const getTestimonials = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
    });
  }
};

/**
 * GET /api/v1/testimonials/admin
 *
 * Admin endpoint.
 * Returns all testimonials including inactive records.
 */
export const getAllTestimonials = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error('Error fetching all testimonials:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
    });
  }
};

/**
 * POST /api/v1/testimonials
 *
 * Admin only.
 */
export const createTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      author,
      role,
      content,
      imageUrl,
      rating,
      isActive,
      sortOrder,
    } = req.body;

    if (!author || !role || !content) {
      res.status(400).json({
        success: false,
        message: 'Author, role and content are required',
      });
      return;
    }

    const normalizedRating =
      typeof rating === 'number' ? rating : 5;

    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
      return;
    }

    const normalizedSortOrder =
      typeof sortOrder === 'number' ? sortOrder : 0;

    if (
      !Number.isInteger(normalizedSortOrder) ||
      normalizedSortOrder < 0
    ) {
      res.status(400).json({
        success: false,
        message: 'Display order must be a non-negative integer',
      });
      return;
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        author: String(author).trim(),
        role: String(role).trim(),
        content: String(content).trim(),
        imageUrl:
          imageUrl === null || imageUrl === ''
            ? null
            : String(imageUrl).trim(),
        rating: normalizedRating,
        isActive:
          typeof isActive === 'boolean' ? isActive : true,
        sortOrder: normalizedSortOrder,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial,
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create testimonial',
    });
  }
};

/**
 * PUT /api/v1/testimonials/:id
 *
 * Admin only.
 */
export const updateTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Testimonial ID is required',
      });
      return;
    }

    const existing = await prisma.testimonial.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
      return;
    }

    const {
      author,
      role,
      content,
      imageUrl,
      rating,
      isActive,
      sortOrder,
    } = req.body;

    if (author !== undefined && !String(author).trim()) {
      res.status(400).json({
        success: false,
        message: 'Author cannot be empty',
      });
      return;
    }

    if (role !== undefined && !String(role).trim()) {
      res.status(400).json({
        success: false,
        message: 'Role cannot be empty',
      });
      return;
    }

    if (content !== undefined && !String(content).trim()) {
      res.status(400).json({
        success: false,
        message: 'Content cannot be empty',
      });
      return;
    }

    if (rating !== undefined) {
      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5',
        });
        return;
      }
    }

    if (sortOrder !== undefined) {
      if (
        !Number.isInteger(sortOrder) ||
        sortOrder < 0
      ) {
        res.status(400).json({
          success: false,
          message: 'Display order must be a non-negative integer',
        });
        return;
      }
    }

    const testimonial = await prisma.testimonial.update({
      where: {
        id,
      },
      data: {
        ...(author !== undefined && {
          author: String(author).trim(),
        }),
        ...(role !== undefined && {
          role: String(role).trim(),
        }),
        ...(content !== undefined && {
          content: String(content).trim(),
        }),
        ...(imageUrl !== undefined && {
          imageUrl:
            imageUrl === null || imageUrl === ''
              ? null
              : String(imageUrl).trim(),
        }),
        ...(rating !== undefined && {
          rating,
        }),
        ...(typeof isActive === 'boolean' && {
          isActive,
        }),
        ...(sortOrder !== undefined && {
          sortOrder,
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial,
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update testimonial',
    });
  }
};

/**
 * DELETE /api/v1/testimonials/:id
 *
 * Admin only.
 */
export const deleteTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Testimonial ID is required',
      });
      return;
    }

    const existing = await prisma.testimonial.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
      return;
    }

    await prisma.testimonial.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete testimonial',
    });
  }
};
