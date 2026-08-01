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
 * Middleware to authenticate requests
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('authentication running');
    const tokenCookie = req.cookies?.authToken;
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    console.log('Token from cookie:', tokenCookie);
    console.log('Authorization header:', authHeader);

    if (tokenCookie) {
      token = tokenCookie;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Log token info (safely)

    // Verify token with proper type handling
    let decoded;
    try {
      // First verify the token
      decoded = jwt.verify(token, JWT_SECRET as string);

      // Then check if it has the expected structure
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token structure - not an object');
      }

      if (!('userId' in decoded)) {
        throw new Error('Invalid token structure - no userId');
      }
      if (decoded) {
        console.log('authentication success');
      }
    } catch (verifyError) {
      console.error(
        '[AUTH] Token verification failed:',
        verifyError instanceof Error ? verifyError.message : String(verifyError)
      );
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    const { userId } = decoded as JWTPayload;

    // Get user details
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
      data: { lastLogin: new Date() },
    });

    next();
  } catch (error) {
    console.error(
      '[AUTH] Authentication middleware error:',
      error instanceof Error ? error.message : String(error)
    );

    // Log stack trace for debugging
    if (error instanceof Error && error.stack) {
      console.error('[AUTH] Error stack:', error.stack);
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};
