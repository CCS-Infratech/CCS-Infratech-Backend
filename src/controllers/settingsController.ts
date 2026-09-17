import { Request, Response } from 'express';
import { prisma } from '@/configs/db';

/**
 * GET /api/v1/settings
 *
 * Public endpoint.
 * Returns the single global website settings record.
 */
export const getSettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    // Create the default single settings record if it does not exist.
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 1,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings',
    });
  }
};

/**
 * PUT /api/v1/settings
 *
 * Admin only.
 * Updates the single global website settings record.
 */
export const updateSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      companyName,
      companyDescription,
      phone,
      phone2,
      email,
      email2,
      whatsapp,
      websiteUrl,
      address,
      registeredOffice,
      corporateOffice,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      linkedinUrl,
      twitterUrl,
      logoUrl,
      faviconUrl,
      footerText,
      mapUrl,
      googleMapUrl,
      workingHours,
    } = req.body;

    const settings = await prisma.siteSettings.upsert({
      where: {
        id: 1,
      },
      create: {
        id: 1,
        companyName,
        companyDescription,
        phone,
        phone2,
        email,
        email2,
        whatsapp,
        websiteUrl,
        address,
        registeredOffice,
        corporateOffice,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        linkedinUrl,
        twitterUrl,
        logoUrl,
        faviconUrl,
        footerText,
        mapUrl,
        googleMapUrl,
        workingHours,
      },
      update: {
        companyName,
        companyDescription,
        phone,
        phone2,
        email,
        email2,
        whatsapp,
        websiteUrl,
        address,
        registeredOffice,
        corporateOffice,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        linkedinUrl,
        twitterUrl,
        logoUrl,
        faviconUrl,
        footerText,
        mapUrl,
        googleMapUrl,
        workingHours,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Site settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Error updating site settings:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update site settings',
    });
  }
};
