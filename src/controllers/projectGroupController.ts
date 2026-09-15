import { Request, Response } from 'express';
import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';
import slugify from 'slugify';
import { validate as isUuid } from 'uuid';
import { routeParam } from '@/utils/helper';

const publishedProjectInclude = {
  images: {
    orderBy: [{ isFeatured: 'desc' as const }, { displayOrder: 'asc' as const }],
    take: 1,
  },
  group: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

const createProjectGroupHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, description, isActive, sortOrder } = req.body;

  if (!name?.trim()) {
    res.status(400).json({
      success: false,
      message: 'Project group name is required',
    });
    return;
  }

  let slug = slugify(name, { lower: true, strict: true });
  const existingSlug = await prisma.projectGroup.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
  }

  const group = await prisma.projectGroup.create({
    data: {
      name: name.trim(),
      slug,
      description: description || null,
      isActive: isActive !== undefined ? !!isActive : true,
      sortOrder: Number(sortOrder) || 0,
    },
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Project group created successfully',
    data: group,
  });
};

const getProjectGroupsHandler = async (req: Request, res: Response): Promise<void> => {
  const groups = await prisma.projectGroup.findMany({
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  res.status(200).json({
    success: true,
    data: groups,
  });
};

const getPublishedProjectGroupsHandler = async (_req: Request, res: Response): Promise<void> => {
  const groups = await prisma.projectGroup.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      _count: {
        select: {
          projects: {
            where: { published: true },
          },
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  res.status(200).json({
    success: true,
    data: groups,
  });
};

const getProjectGroupHandler = async (req: Request, res: Response): Promise<void> => {
  const identifier = routeParam(req.params.id);
  const isId = isUuid(identifier);

  const group = await prisma.projectGroup.findFirst({
    where: isId ? { id: identifier } : { slug: identifier },
    include: {
      projects: {
        include: {
          images: {
            where: { isFeatured: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!group) {
    res.status(404).json({
      success: false,
      message: 'Project group not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: group,
  });
};

const getPublishedProjectGroupHandler = async (req: Request, res: Response): Promise<void> => {
  const identifier = routeParam(req.params.id);
  const isId = isUuid(identifier);

  const group = await prisma.projectGroup.findFirst({
    where: {
      isActive: true,
      ...(isId ? { id: identifier } : { slug: identifier }),
    },
    include: {
      projects: {
        where: { published: true },
        include: publishedProjectInclude,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      },
    },
  });

  if (!group) {
    res.status(404).json({
      success: false,
      message: 'Project group not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: group,
  });
};

const updateProjectGroupHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);
  const { name, description, isActive, sortOrder } = req.body;

  const existing = await prisma.projectGroup.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({
      success: false,
      message: 'Project group not found',
    });
    return;
  }

  const updateData: {
    name?: string;
    slug?: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  } = {};

  if (name !== undefined) {
    updateData.name = name.trim();
    let newSlug = slugify(name, { lower: true, strict: true });
    const slugTaken = await prisma.projectGroup.findFirst({
      where: { slug: newSlug, id: { not: id } },
    });
    if (slugTaken) {
      newSlug = `${newSlug}-${Math.floor(Math.random() * 10000)}`;
    }
    updateData.slug = newSlug;
  }

  if (description !== undefined) updateData.description = description || null;
  if (isActive !== undefined) updateData.isActive = !!isActive;
  if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder) || 0;

  const group = await prisma.projectGroup.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Project group updated successfully',
    data: group,
  });
};

const deleteProjectGroupHandler = async (req: Request, res: Response): Promise<void> => {
  const id = routeParam(req.params.id);

  const existing = await prisma.projectGroup.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({
      success: false,
      message: 'Project group not found',
    });
    return;
  }

  await prisma.projectGroup.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Project group deleted successfully',
  });
};

export const createProjectGroup = controllerWrapper(createProjectGroupHandler);
export const getProjectGroups = controllerWrapper(getProjectGroupsHandler);
export const getPublishedProjectGroups = controllerWrapper(getPublishedProjectGroupsHandler);
export const getProjectGroup = controllerWrapper(getProjectGroupHandler);
export const getPublishedProjectGroup = controllerWrapper(getPublishedProjectGroupHandler);
export const updateProjectGroup = controllerWrapper(updateProjectGroupHandler);
export const deleteProjectGroup = controllerWrapper(deleteProjectGroupHandler);
