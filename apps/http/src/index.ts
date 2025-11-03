import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import Jwt from 'jsonwebtoken';
import { z } from 'zod';
import dotenv from 'dotenv';
import { prismaClient } from '@repo/db/client';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== Validation Schemas ==========
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  role: z.enum(['JOB_SEEKER', 'JOB_PROVIDER'], {
    message: 'Role must be either JOB_SEEKER or JOB_PROVIDER',
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const applicantProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  education: z.string().optional(),
  skills: z.array(z.object({
    skillId: z.string(),
    certificateUrl: z.string().optional(),
  })).optional(),
  employmentHistory: z.array(z.object({
    companyName: z.string(),
    duration: z.string(),
    description: z.string().optional(),
  })).optional(),
  references: z.array(z.object({
    name: z.string(),
    contact: z.string(),
    description: z.string().optional(),
  })).optional(),
});

const employerProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyDescription: z.string().optional(),
  companyWebsite: z.string().optional(),
  contactInfo: z.string().optional(),
});

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  pay: z.number().positive('Pay must be positive'),
  employmentType: z.enum(['PER_DAY', 'PER_PROJECT']),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
});

// ========== Middleware ==========
const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  };
};

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = Jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user.role !== role) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

// ========== Auth Routes ==========
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/signup', validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prismaClient.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = Jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = Jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========== Applicant Routes ==========

// Create applicant profile
app.post('/api/applicant/profile', authenticate, checkRole('JOB_SEEKER'), validate(applicantProfileSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, address, phone, education, skills, employmentHistory, references } = req.body;

    const existingProfile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Profile already exists' });
    }

    const newProfile = await prismaClient.jobSeekerProfile.create({
      data: {
        userId,
        name,
        address,
        phone,
        education,
        skills: {
          create: skills?.map((skill: any) => ({
            skillId: skill.skillId,
            certificateUrl: skill.certificateUrl,
          })) || [],
        },
        employmentHistory: {
          create: employmentHistory?.map((emp: any) => ({
            companyName: emp.companyName,
            duration: emp.duration,
            description: emp.description,
          })) || [],
        },
        references: {
          create: references?.map((ref: any) => ({
            name: ref.name,
            contact: ref.contact,
            description: ref.description,
          })) || [],
        },
      },
      include: {
        skills: { include: { skill: true } },
        employmentHistory: true,
        references: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: newProfile,
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get applicant profile
app.get('/api/applicant/profile', authenticate, checkRole('JOB_SEEKER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        employmentHistory: true,
        references: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update applicant profile
app.put('/api/applicant/profile', authenticate, checkRole('JOB_SEEKER'), validate(applicantProfileSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, address, phone, education, skills, employmentHistory, references } = req.body;

    const existingProfile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Delete existing relations
    await prismaClient.userSkill.deleteMany({ where: { jobSeekerProfileId: existingProfile.id } });
    await prismaClient.employmentHistory.deleteMany({ where: { jobSeekerProfileId: existingProfile.id } });
    await prismaClient.reference.deleteMany({ where: { jobSeekerProfileId: existingProfile.id } });

    // Update profile with new data
    const updatedProfile = await prismaClient.jobSeekerProfile.update({
      where: { userId },
      data: {
        name,
        address,
        phone,
        education,
        skills: {
          create: skills?.map((skill: any) => ({
            skillId: skill.skillId,
            certificateUrl: skill.certificateUrl,
          })) || [],
        },
        employmentHistory: {
          create: employmentHistory?.map((emp: any) => ({
            companyName: emp.companyName,
            duration: emp.duration,
            description: emp.description,
          })) || [],
        },
        references: {
          create: references?.map((ref: any) => ({
            name: ref.name,
            contact: ref.contact,
            description: ref.description,
          })) || [],
        },
      },
      include: {
        skills: { include: { skill: true } },
        employmentHistory: true,
        references: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete applicant profile
app.delete('/api/applicant/profile', authenticate, checkRole('JOB_SEEKER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await prismaClient.jobSeekerProfile.delete({
      where: { userId },
    });

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all my applications
app.get('/api/applicant/applications', authenticate, checkRole('JOB_SEEKER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const applications = await prismaClient.application.findMany({
      where: { jobSeekerProfileId: profile.id },
      include: {
        job: {
          include: {
            jobProviderProfile: true,
          },
        },
      },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Apply to a job
app.post('/api/applications', authenticate, checkRole('JOB_SEEKER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { jobId } = req.body;

    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found. Create profile first.' });
    }

    const job = await prismaClient.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Job is not open for applications' });
    }

    const existingApplication = await prismaClient.application.findUnique({
      where: {
        jobId_jobSeekerProfileId: {
          jobId,
          jobSeekerProfileId: profile.id,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }

    const newApplication = await prismaClient.application.create({
      data: {
        jobId,
        jobSeekerProfileId: profile.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication,
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Withdraw application
app.delete('/api/applications/:id', authenticate, checkRole('JOB_SEEKER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const application = await prismaClient.application.findUnique({
      where: { id },
    });

    if (!application || application.jobSeekerProfileId !== profile.id) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await prismaClient.application.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========== Employer Routes ==========

// Create employer profile
app.post('/api/employer/profile', authenticate, checkRole('JOB_PROVIDER'), validate(employerProfileSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { companyName, companyDescription, companyWebsite, contactInfo } = req.body;

    const existingProfile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Profile already exists' });
    }

    const newProfile = await prismaClient.jobProviderProfile.create({
      data: {
        userId,
        companyName,
        companyDescription,
        companyWebsite,
        contactInfo,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Employer profile created successfully',
      data: newProfile,
    });
  } catch (error) {
    console.error('Create employer profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employer profile
app.get('/api/employer/profile', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get employer profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update employer profile
app.put('/api/employer/profile', authenticate, checkRole('JOB_PROVIDER'), validate(employerProfileSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { companyName, companyDescription, companyWebsite, contactInfo } = req.body;

    const existingProfile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const updatedProfile = await prismaClient.jobProviderProfile.update({
      where: { userId },
      data: {
        companyName,
        companyDescription,
        companyWebsite,
        contactInfo,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Update employer profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete employer profile
app.delete('/api/employer/profile', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await prismaClient.jobProviderProfile.delete({
      where: { userId },
    });

    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete employer profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create job
app.post('/api/employer/jobs', authenticate, checkRole('JOB_PROVIDER'), validate(jobSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, pay, employmentType, location, duration, requiredSkills } = req.body;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Employer profile not found. Create profile first.' });
    }

    const newJob = await prismaClient.job.create({
      data: {
        jobProviderProfileId: profile.id,
        title,
        description,
        pay,
        employmentType,
        location,
        duration,
        requiredSkills: {
          create: requiredSkills?.map((skillId: string) => ({
            skillId,
          })) || [],
        },
      },
      include: {
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: newJob,
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all my jobs
app.get('/api/employer/jobs', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const jobs = await prismaClient.job.findMany({
      where: { jobProviderProfileId: profile.id },
      include: {
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update job
app.put('/api/employer/jobs/:id', authenticate, checkRole('JOB_PROVIDER'), validate(jobSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { title, description, pay, employmentType, location, duration, requiredSkills } = req.body;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const job = await prismaClient.job.findUnique({
      where: { id },
    });

    if (!job || job.jobProviderProfileId !== profile.id) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Delete existing required skills
    await prismaClient.jobSkill.deleteMany({ where: { jobId: id } });

    const updatedJob = await prismaClient.job.update({
      where: { id },
      data: {
        title,
        description,
        pay,
        employmentType,
        location,
        duration,
        requiredSkills: {
          create: requiredSkills?.map((skillId: string) => ({
            skillId,
          })) || [],
        },
      },
      include: {
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete job
app.delete('/api/employer/jobs/:id', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const job = await prismaClient.job.findUnique({
      where: { id },
    });

    if (!job || job.jobProviderProfileId !== profile.id) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await prismaClient.job.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all applicants for a job
app.get('/api/employer/jobs/:id/applicants', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const profile = await prismaClient.jobProviderProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const job = await prismaClient.job.findUnique({
      where: { id },
    });

    if (!job || job.jobProviderProfileId !== profile.id) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const applications = await prismaClient.application.findMany({
      where: { jobId: id },
      include: {
        jobSeekerProfile: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            employmentHistory: true,
            references: true,
          },
        },
      },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========== Common Routes ==========

// Get all available jobs (Job Feed)
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const { pay_min, pay_max, location, employmentType, skills, sort } = req.query;

    let whereClause: any = {
      status: 'OPEN',
    };

    // Filter by pay range
    if (pay_min || pay_max) {
      whereClause.pay = {};
      if (pay_min) whereClause.pay.gte = parseFloat(pay_min as string);
      if (pay_max) whereClause.pay.lte = parseFloat(pay_max as string);
    }

    // Filter by location
    if (location) {
      whereClause.location = {
        contains: location as string,
        mode: 'insensitive',
      };
    }

    // Filter by employment type
    if (employmentType) {
      whereClause.employmentType = employmentType;
    }

    // Filter by skills
    if (skills) {
      const skillIds = (skills as string).split(',');
      whereClause.requiredSkills = {
        some: {
          skillId: {
            in: skillIds,
          },
        },
      };
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // Default: recent first
    if (sort === 'pay_asc') orderBy = { pay: 'asc' };
    if (sort === 'pay_desc') orderBy = { pay: 'desc' };

    const jobs = await prismaClient.job.findMany({
      where: whereClause,
      orderBy,
      include: {
        jobProviderProfile: {
          select: {
            companyName: true,
            companyDescription: true,
          },
        },
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get single job details
app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prismaClient.job.findUnique({
      where: { id },
      include: {
        jobProviderProfile: {
          select: {
            companyName: true,
            companyDescription: true,
            companyWebsite: true,
            contactInfo: true,
          },
        },
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all available skills
app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const skills = await prismaClient.skill.findMany({
      orderBy: { skillName: 'asc' },
    });

    res.json({ success: true, data: skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get applicant public profile (for employer to view)
app.get('/api/applicant/:id', authenticate, checkRole('JOB_PROVIDER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await prismaClient.jobSeekerProfile.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        employmentHistory: true,
        references: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get applicant profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========== 404 Handler ==========
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Add this function before app.listen() in your index.ts

// Auto-seed skills on server start
const seedSkills = async () => {
  try {
    const skills = [
      { skillName: 'Carpentry', requiresCertificate: true },
      { skillName: 'Plumbing', requiresCertificate: true },
      { skillName: 'Electrical Work', requiresCertificate: true },
      { skillName: 'Welding', requiresCertificate: true },
      { skillName: 'Driving', requiresCertificate: true },
      { skillName: 'Security Guard', requiresCertificate: true },
      { skillName: 'AC Repair', requiresCertificate: true },
      { skillName: 'Painting', requiresCertificate: false },
      { skillName: 'Masonry', requiresCertificate: false },
      { skillName: 'Tailoring', requiresCertificate: false },
      { skillName: 'Cooking', requiresCertificate: false },
      { skillName: 'Cleaning', requiresCertificate: false },
      { skillName: 'Gardening', requiresCertificate: false },
      { skillName: 'Mobile Repair', requiresCertificate: false },
      { skillName: 'House Keeping', requiresCertificate: false },
      { skillName: 'Brick Laying', requiresCertificate: false },
      { skillName: 'Tile Fitting', requiresCertificate: false },
      { skillName: 'Construction Helper', requiresCertificate: false },
      { skillName: 'Delivery Boy', requiresCertificate: false },
      { skillName: 'Waiter', requiresCertificate: false },
    ];

    let count = 0;

    for (const skill of skills) {
      const existing = await prismaClient.skill.findUnique({
        where: { skillName: skill.skillName },
      });

      if (!existing) {
        await prismaClient.skill.create({ data: skill });
        count++;
      }
    }

    if (count > 0) {
      console.log(`✅ Seeded ${count} new skills`);
    } else {
      console.log('✅ Skills already exist in database');
    }
  } catch (error) {
    console.error('❌ Error seeding skills:', error);
  }
};

// ========== Start Server ==========
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  
  // Auto-seed skills on startup
  await seedSkills();
});

export default app;