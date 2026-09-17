import { prisma } from '@/configs/db';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('WARNING: JWT_SECRET not set in environment variables!');
}

// Define the expected payload structure
interface JWTPayload {
  userId: string;
}

// Define the global Express Request type extension
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
 * Middleware to authenticate requests.
 *
 * This verifies the JWT, loads the user from the database,
 * checks that the account is active, and attaches the user
 * information to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tokenCookie = req.cookies?.authToken;
    const authHeader = req.headers.authorization;

    let token: string | undefined;

    if (tokenCookie) {
      token = tokenCookie;
    } else if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    let decoded: string | jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET as string);

      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token structure');
      }

      if (!('userId' in decoded)) {
        throw new Error('Invalid token structure - no userId');
      }
    } catch (verifyError) {
      console.error(
        '[AUTH] Token verification failed:',
        verifyError instanceof Error
          ? verifyError.message
          : String(verifyError)
      );

      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    const { userId } = decoded as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });

    next();
  } catch (error) {
    console.error(
      '[AUTH] Authentication middleware error:',
      error instanceof Error ? error.message : String(error)
    );

    if (error instanceof Error && error.stack) {
      console.error('[AUTH] Error stack:', error.stack);
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware.
 *
 * Must be used after authenticate.
 *
 * Example:
 * router.get('/', authenticate, authorize('admin', 'sales'), handler);
 */
export const authorize = (...allowedRoles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const userRole = req.user?.role?.toLowerCase();

    if (!userRole) {
      res.status(403).json({
        success: false,
        message: 'User role not available',
      });
      return;
    }

    const normalizedRoles = allowedRoles.map((role) =>
      role.toLowerCase()
    );

    if (!normalizedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};
