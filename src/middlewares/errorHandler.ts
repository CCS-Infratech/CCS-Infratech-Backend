import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Default error
  let statusCode = 500;
  let message = 'Something went wrong';

  // Prisma validation errors (missing fields, wrong types)
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;

    // ✅ Extract clean error message from Prisma's verbose output
    const missingFieldMatch = err.message.match(/Argument `(\w+)` is missing/);
    const invalidTypeMatch = err.message.match(/Argument `(\w+)`.*Got invalid value/);

    if (missingFieldMatch) {
      message = `${missingFieldMatch[1]} is required`;
    } else if (invalidTypeMatch) {
      message = `Invalid value provided for ${invalidTypeMatch[1]}`;
    } else {
      // Try to extract any other meaningful error from the last line
      const lines = err.message.split('\n').filter((line: string) => line.trim());
      const lastMeaningfulLine = lines
        .reverse()
        .find(
          (line: string) =>
            !line.includes('invocation') &&
            !line.includes('Invalid `') &&
            !line.includes('prisma') &&
            line.length > 0
        );
      message = lastMeaningfulLine?.trim() || 'Invalid data provided';
    }
  }

  // Prisma known errors (P2002, P2003, etc.)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    if (err.code === 'P2002') {
      // ✅ Extract field name from unique constraint error
      const field = err.meta?.target as string[] | undefined;
      message = field ? `${field[0]} already exists` : 'Record already exists';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      const field = err.meta?.field_name as string | undefined;
      message = field ? `Invalid ${field} provided` : 'Invalid reference data';
    } else if (err.code === 'P2014') {
      statusCode = 400;
      message = 'Invalid relation data provided';
    } else {
      message = 'Database operation failed';
    }
  }

  // Custom errors with statusCode
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Generic errors
  else if (err.message) {
    message = err.message;
  }

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR:', err);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
  });
};
