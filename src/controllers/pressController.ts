import { Request, Response } from 'express';
import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';

/**
 * Get all press categories
 */
const getAllPressHandler = async (req: Request, res: Response): Promise<void> => {
  const pressCategories = await prisma.press.findMany({
    include: {
      items: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: pressCategories,
  });
};

/**
 * Get all published press articles (where isActive is true)
 */
const getPublishedPressHandler = async (req: Request, res: Response): Promise<void> => {
  const pressCategories = await prisma.press.findMany({
    where: {
      isActive: true,
    },
    include: {
      items: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: pressCategories,
    count: pressCategories.length,
  });
};

/**
 * Get a press category by ID
 */
const getPressByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const press = await prisma.press.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (!press) {
    res.status(404).json({
      success: false,
      message: 'Press category not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: press,
  });
};

/**
 * Create new press category
 */
const createPressHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, description = '', slug, isActive = true, items = [] } = req.body;

  // Validation
  if (!name || !slug) {
    res.status(400).json({
      success: false,
      message: 'Name and slug are required',
    });
    return;
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    res.status(400).json({
      success: false,
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    });
    return;
  }

  // Validate items
  if (items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'At least one press item is required',
    });
    return;
  }

  if (items.length > 1) {
    res.status(400).json({
      success: false,
      message: 'Only one press item is allowed per section',
    });
    return;
  }

  // Validate required fields in items
  for (const item of items) {
    if (!item.title || !item.title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Press item title is required',
      });
      return;
    }
  }

  // Check if slug already exists
  const existingPress = await prisma.press.findUnique({
    where: { slug },
  });

  if (existingPress) {
    res.status(400).json({
      success: false,
      message: 'A press category with this slug already exists',
    });
    return;
  }

  // Create press category with items
  const press = await prisma.press.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      slug: slug.trim(),
      isActive: !!isActive,
      items: {
        create: items.map((item: any, index: number) => ({
          title: item.title.trim(),
          publicationName: item.publicationName?.trim() || null,
          publicationDate: item.publicationDate ? new Date(item.publicationDate) : null,
          url: item.url?.trim() || null,
          imageUrl: item.imageUrl?.trim() || null,
          excerpt: item.excerpt?.trim() || null,
          sortOrder: item.sortOrder ?? index,
        })),
      },
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Press category created successfully',
    data: press,
  });
};

/**
 * Update a press category
 */
const updatePressHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, slug, isActive, items = [] } = req.body;

  // Check if press category exists
  const existingPress = await prisma.press.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingPress) {
    res.status(404).json({
      success: false,
      message: 'Press category not found',
    });
    return;
  }

  // Check if the slug is already used by a different press category
  if (slug && slug !== existingPress.slug) {
    const slugExists = await prisma.press.findUnique({
      where: { slug },
    });

    if (slugExists) {
      res.status(400).json({
        success: false,
        message: 'A press category with this slug already exists',
      });
      return;
    }
  }

  // Get existing press item IDs for comparison
  const existingItemIds = existingPress.items.map((item) => item.id);
  const newItemIds = items.filter((item: any) => item.id).map((item: any) => item.id);

  // Find items to delete (exists in DB but not in the request)
  const itemsToDelete = existingItemIds.filter((id) => !newItemIds.includes(id));

  // Transaction to ensure all operations complete or none do
  const press = await prisma.$transaction(async (tx) => {
    // 1. Update the press category basic information
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updatedPress = await tx.press.update({
      where: { id },
      data: updateData,
    });

    // 2. Delete items that are no longer in the array
    if (itemsToDelete.length > 0) {
      await tx.pressItem.deleteMany({
        where: {
          id: { in: itemsToDelete },
          pressId: id,
        },
      });
    }

    // 3. Process each item in the request
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.id && existingItemIds.includes(item.id)) {
        // Update existing press item
        await tx.pressItem.update({
          where: { id: item.id },
          data: {
            title: item.title?.trim() || '',
            publicationName: item.publicationName?.trim() || null,
            publicationDate: item.publicationDate ? new Date(item.publicationDate) : null,
            url: item.url?.trim() || null,
            imageUrl: item.imageUrl?.trim() || null,
            excerpt: item.excerpt?.trim() || null,
            sortOrder: item.sortOrder ?? i,
          },
        });
      } else {
        // Create new press item
        await tx.pressItem.create({
          data: {
            title: item.title?.trim() || '',
            publicationName: item.publicationName?.trim() || null,
            publicationDate: item.publicationDate ? new Date(item.publicationDate) : null,
            url: item.url?.trim() || null,
            imageUrl: item.imageUrl?.trim() || null,
            excerpt: item.excerpt?.trim() || null,
            sortOrder: item.sortOrder ?? i,
            pressId: id,
          },
        });
      }
    }

    // Return the press category with updated items
    return tx.press.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  });

  res.status(200).json({
    success: true,
    message: 'Press category updated successfully',
    data: press,
  });
};

/**
 * Delete a press category
 */
const deletePressHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if press category exists
  const press = await prisma.press.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!press) {
    res.status(404).json({
      success: false,
      message: 'Press category not found',
    });
    return;
  }

  // Delete press category (will cascade delete items from DB due to onDelete: Cascade)
  await prisma.press.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Press category deleted successfully',
  });
};

/**
 * Delete a press item
 */
const deletePressItemHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if press item exists
  const item = await prisma.pressItem.findUnique({
    where: { id },
  });

  if (!item) {
    res.status(404).json({
      success: false,
      message: 'Press item not found',
    });
    return;
  }

  // Delete press item
  await prisma.pressItem.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Press item deleted successfully',
  });
};

// Export all controllers with controllerWrapper
export const getAllPress = controllerWrapper(getAllPressHandler);
export const getPublishedPress = controllerWrapper(getPublishedPressHandler);
export const getPressById = controllerWrapper(getPressByIdHandler);
export const createPress = controllerWrapper(createPressHandler);
export const updatePress = controllerWrapper(updatePressHandler);
export const deletePress = controllerWrapper(deletePressHandler);
export const deletePressItem = controllerWrapper(deletePressItemHandler);
