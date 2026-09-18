import { Request, Response } from 'express';
import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';
import { routeParam } from '@/utils/helper';

/**
 * Get all walkthroughs
 * Used by the admin CMS.
 */
const getAllWalkthroughsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const walkthroughs = await prisma.walkthrough.findMany({
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  res.status(200).json({
    success: true,
    data: walkthroughs,
    count: walkthroughs.length,
  });
};

/**
 * Get all published walkthroughs.
 */
const getPublishedWalkthroughsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const walkthroughs = await prisma.walkthrough.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  res.status(200).json({
    success: true,
    data: walkthroughs,
    count: walkthroughs.length,
  });
};

/**
 * Get a walkthrough by ID.
 */
const getWalkthroughByIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = routeParam(req.params.id);

  const walkthrough = await prisma.walkthrough.findUnique({
    where: { id },
  });

  if (!walkthrough) {
    res.status(404).json({
      success: false,
      message: 'Walkthrough not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: walkthrough,
  });
};

/**
 * Create a walkthrough.
 */
const createWalkthroughHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    title,
    description,
    videoUrl,
    thumbnail,
    isActive = true,
    sortOrder = 0,
  } = req.body;

  if (!title || !videoUrl || !thumbnail) {
    res.status(400).json({
      success: false,
      message: 'Title, video URL, and thumbnail are required',
    });
    return;
  }

  const walkthrough = await prisma.walkthrough.create({
    data: {
      title: String(title).trim(),
      description:
        description !== undefined && description !== null
          ? String(description).trim()
          : null,
      videoUrl: String(videoUrl).trim(),
      thumbnail: String(thumbnail).trim(),
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Walkthrough created successfully',
    data: walkthrough,
  });
};

/**
 * Update a walkthrough.
 */
const updateWalkthroughHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = routeParam(req.params.id);

  const existingWalkthrough = await prisma.walkthrough.findUnique({
    where: { id },
  });

  if (!existingWalkthrough) {
    res.status(404).json({
      success: false,
      message: 'Walkthrough not found',
    });
    return;
  }

  const {
    title,
    description,
    videoUrl,
    thumbnail,
    isActive,
    sortOrder,
  } = req.body;

  const updateData: {
    title?: string;
    description?: string | null;
    videoUrl?: string;
    thumbnail?: string;
    isActive?: boolean;
    sortOrder?: number;
  } = {};

  if (title !== undefined) {
    updateData.title = String(title).trim();
  }

  if (description !== undefined) {
    updateData.description =
      description === null ? null : String(description).trim();
  }

  if (videoUrl !== undefined) {
    updateData.videoUrl = String(videoUrl).trim();
  }

  if (thumbnail !== undefined) {
    updateData.thumbnail = String(thumbnail).trim();
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  if (sortOrder !== undefined) {
    updateData.sortOrder = Number(sortOrder) || 0;
  }

  const walkthrough = await prisma.walkthrough.update({
    where: { id },
    data: updateData,
  });

  res.status(200).json({
    success: true,
    message: 'Walkthrough updated successfully',
    data: walkthrough,
  });
};

/**
 * Delete a walkthrough.
 */
const deleteWalkthroughHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = routeParam(req.params.id);

  const existingWalkthrough = await prisma.walkthrough.findUnique({
    where: { id },
  });

  if (!existingWalkthrough) {
    res.status(404).json({
      success: false,
      message: 'Walkthrough not found',
    });
    return;
  }

  await prisma.walkthrough.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Walkthrough deleted successfully',
  });
};

export const getAllWalkthroughs = controllerWrapper(
  getAllWalkthroughsHandler
);

export const getPublishedWalkthroughs = controllerWrapper(
  getPublishedWalkthroughsHandler
);

export const getWalkthroughById = controllerWrapper(
  getWalkthroughByIdHandler
);

export const createWalkthrough = controllerWrapper(
  createWalkthroughHandler
);

export const updateWalkthrough = controllerWrapper(
  updateWalkthroughHandler
);

export const deleteWalkthrough = controllerWrapper(
  deleteWalkthroughHandler
);
