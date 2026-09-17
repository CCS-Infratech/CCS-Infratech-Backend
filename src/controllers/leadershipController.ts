import { Request, Response } from 'express';
import { prisma } from '@/configs/db';

/**
 * GET /api/v1/leadership
 *
 * Public endpoint.
 * Returns active leadership/team members ordered by sortOrder.
 */
export const getLeadership = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const leadership = await prisma.leadership.findMany({
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
      data: leadership,
    });
  } catch (error) {
    console.error('Error fetching leadership:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership',
    });
  }
};

/**
 * GET /api/v1/leadership/admin
 *
 * Admin endpoint.
 * Returns all leadership/team members including inactive records.
 */
export const getAllLeadership = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const leadership = await prisma.leadership.findMany({
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
      data: leadership,
    });
  } catch (error) {
    console.error('Error fetching all leadership:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership',
    });
  }
};

/**
 * POST /api/v1/leadership
 *
 * Admin only.
 */
export const createLeadership = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      designation,
      imageUrl,
      experience,
      bio,
      isActive,
      sortOrder,
    } = req.body;

    if (!name || !designation) {
      res.status(400).json({
        success: false,
        message: 'Name and designation are required',
      });
      return;
    }

    const leadership = await prisma.leadership.create({
      data: {
        name: String(name).trim(),
        designation: String(designation).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        experience: experience ? String(experience).trim() : null,
        bio: bio ? String(bio).trim() : null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        sortOrder:
          typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Leadership member created successfully',
      data: leadership,
    });
  } catch (error) {
    console.error('Error creating leadership:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create leadership member',
    });
  }
};

/**
 * PUT /api/v1/leadership/:id
 *
 * Admin only.
 */
export const updateLeadership = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Leadership member ID is required',
      });
      return;
    }

    const {
      name,
      designation,
      imageUrl,
      experience,
      bio,
      isActive,
      sortOrder,
    } = req.body;

    const existing = await prisma.leadership.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Leadership member not found',
      });
      return;
    }

    const leadership = await prisma.leadership.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name: String(name).trim(),
        }),

        ...(designation !== undefined && {
          designation: String(designation).trim(),
        }),

        ...(imageUrl !== undefined && {
          imageUrl:
            imageUrl === null || imageUrl === ''
              ? null
              : String(imageUrl).trim(),
        }),

        ...(experience !== undefined && {
          experience:
            experience === null || experience === ''
              ? null
              : String(experience).trim(),
        }),

        ...(bio !== undefined && {
          bio:
            bio === null || bio === ''
              ? null
              : String(bio).trim(),
        }),

        ...(typeof isActive === 'boolean' && {
          isActive,
        }),

        ...(typeof sortOrder === 'number' && {
          sortOrder,
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leadership member updated successfully',
      data: leadership,
    });
  } catch (error) {
    console.error('Error updating leadership:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update leadership member',
    });
  }
};

/**
 * DELETE /api/v1/leadership/:id
 *
 * Admin only.
 */
export const deleteLeadership = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Leadership member ID is required',
      });
      return;
    }

    const existing = await prisma.leadership.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Leadership member not found',
      });
      return;
    }

    await prisma.leadership.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Leadership member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting leadership:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete leadership member',
    });
  }
};
