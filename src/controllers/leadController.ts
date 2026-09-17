import { Request, Response } from 'express';
import { LeadStatus, LeadType } from '@prisma/client';

import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';

const VALID_TYPES = Object.values(LeadType);
const VALID_STATUSES = Object.values(LeadStatus);

/**
 * Create a new lead / enquiry
 */
const createLeadHandler = async (req: Request, res: Response): Promise<void> => {
  const { type, name, phone, email, project, propertyType, budget, visitDate, visitTime, message } =
    req.body;

  if (!name || !phone) {
    res.status(400).json({
      success: false,
      message: 'Name and phone are required',
    });
    return;
  }

  const normalizedType: LeadType = VALID_TYPES.includes(type) ? type : LeadType.LEAD;

  const parsedVisitDate =
    visitDate && !Number.isNaN(new Date(visitDate).getTime()) ? new Date(visitDate) : null;

  const lead = await prisma.lead.create({
    data: {
      type: normalizedType,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      project: project ? String(project).trim() : null,
      propertyType: propertyType ? String(propertyType).trim() : null,
      budget: budget ? String(budget).trim() : null,
      visitDate: parsedVisitDate,
      visitTime: visitTime ? String(visitTime).trim() : null,
      message: message ? String(message).trim() : null,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: lead,
  });
};

/**
 * Get all leads
 */
const getLeadsHandler = async (req: Request, res: Response): Promise<void> => {
  const { type, status, search, page = 1, limit = 20 } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const where: {
    type?: LeadType;
    status?: LeadStatus;
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (typeof type === 'string' && VALID_TYPES.includes(type as LeadType)) {
    where.type = type as LeadType;
  }

  if (typeof status === 'string' && VALID_STATUSES.includes(status as LeadStatus)) {
    where.status = status as LeadStatus;
  }

  if (typeof search === 'string' && search.trim()) {
    const searchValue = search.trim();

    where.OR = [
      {
        name: {
          contains: searchValue,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: searchValue,
        },
      },
      {
        email: {
          contains: searchValue,
          mode: 'insensitive',
        },
      },
      {
        project: {
          contains: searchValue,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNumber,
    }),
    prisma.lead.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: leads,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
    },
  });
};

/**
 * Get a single lead
 */
const getLeadHandler = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);

  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
};

/**
 * Update lead status
 */
const updateLeadHandler = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { status } = req.body;

  if (typeof status !== 'string' || !VALID_STATUSES.includes(status as LeadStatus)) {
    res.status(400).json({
      success: false,
      message: 'Invalid lead status',
    });
    return;
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!existingLead) {
    res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
    return;
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status: status as LeadStatus,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Lead status updated successfully',
    data: lead,
  });
};

/**
 * Delete a lead
 */
const deleteLeadHandler = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);

  const existingLead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!existingLead) {
    res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
    return;
  }

  await prisma.lead.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Lead deleted successfully',
  });
};

export const createLead = controllerWrapper(createLeadHandler);
export const getLeads = controllerWrapper(getLeadsHandler);
export const getLead = controllerWrapper(getLeadHandler);
export const updateLead = controllerWrapper(updateLeadHandler);
export const deleteLead = controllerWrapper(deleteLeadHandler);
