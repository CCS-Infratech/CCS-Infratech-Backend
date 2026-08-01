import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/configs/db';
import { controllerWrapper } from '@/utils/controllerWrapper';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '12h';

/**
 * Register a new user
 */
const registerUserHandler = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  // Validate inputs
  if (!username || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'Username, email, and password are required',
    });
    return;
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'A user with this username or email already exists',
    });
    return;
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      role: req.body.role || 'user',
      passwordHash,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    userId: user.id,
  });
};

/**
 * User login
 */
const loginUserHandler = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({
      success: false,
      message: 'Email/username and password are required',
    });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const payload = {
    userId: user.id,
    role: user.role,
    username: user.username,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie('authToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.ccsinfratech.com',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userInfo = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  res.cookie('userInfo', JSON.stringify(userInfo), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.ccsinfratech.com',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

/**
 * Logout user by invalidating their token
 */
const logoutUserHandler = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.ccsinfratech.com',
  });

  res.clearCookie('userInfo', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.ccsinfratech.com',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * get userdetails
 */
const getCurrentUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Return user data
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user data',
    });
  }
};

export const registerUser = controllerWrapper(registerUserHandler);
export const loginUser = controllerWrapper(loginUserHandler);
export const logoutUser = controllerWrapper(logoutUserHandler);
export const getUserDetails = controllerWrapper(getCurrentUserHandler);
