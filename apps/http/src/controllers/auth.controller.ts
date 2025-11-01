import { Request, Response } from 'express';
import { SignupInput, LoginInput } from '../validators/auth.validator';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

// TODO: Replace with actual Supabase DB calls
// This is mock data for now
const mockUsers: any[] = [];

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body as SignupInput;

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (mock - replace with Supabase insert)
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    // Find user (mock - replace with Supabase query)
    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};