import { Request, Response } from 'express'; // Standard Request
import { z } from 'zod';
import prisma from '../db/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const createJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  url: z.string().url(),
  status: z.enum(['saved', 'applied', 'interviewing', 'rejected', 'offer', 'accepted']).optional(),
  notes: z.string().optional(),
});

const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  url: z.string().url().optional(),
  status: z.enum(['saved', 'applied', 'interviewing', 'rejected', 'offer', 'accepted']).optional(),
  dateApplied: z.string().datetime().optional(),
  notes: z.string().optional(),
  resumeVersion: z.string().optional(),
  coverLetterUsed: z.boolean().optional(),
});

// Use Request instead of AuthRequest
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit, offset } = req.query;

    const where: any = {
      userId: req.userId, // req.userId is now globally recognized
    };

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobApplication.findMany({
      where,
      orderBy: { dateAdded: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined,
      include: {
        interviews: {
          orderBy: { date: 'asc' },
        },
      },
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Standard access to params

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    const job = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        interviews: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createJobSchema.parse(req.body);

    const job = await prisma.jobApplication.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        salary: data.salary,
        url: data.url,
        status: data.status,
        notes: data.notes,
        // Use 'connect' if userId is a relation, 
        // or ensure 'userId' is a plain string field in schema.prisma
        user: {
          connect: { id: req.userId } 
        }
      },
    });

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }
    
    const data = updateJobSchema.parse(req.body);

    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existingJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updateData: any = { ...data };
    if (data.dateApplied) {
      updateData.dateApplied = new Date(data.dateApplied);
    }

    const job = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
    });

    res.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existingJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    await prisma.jobApplication.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getJobStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.jobApplication.findMany({
      where: { userId: req.userId },
      select: {
        status: true,
        dateAdded: true,
        dateApplied: true,
      },
    });

    const total = jobs.length;
    const byStatus: Record<string, number> = {};
    
    jobs.forEach((job: { status: string | number; }) => {
      byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    });

    const responseRate = total > 0 
      ? ((byStatus.interviewing || 0) + (byStatus.offer || 0)) / total 
      : 0;

    let totalDays = 0;
    let respondedCount = 0;
    
    jobs.forEach((job: { dateApplied: { getTime: () => number; }; status: string; }) => {
      if (job.dateApplied && (job.status === 'interviewing' || job.status === 'offer')) {
        const days = Math.floor(
          (new Date().getTime() - job.dateApplied.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
        respondedCount++;
      }
    });

    const averageTimeToResponse = respondedCount > 0 ? totalDays / respondedCount : 0;

    res.json({
      total,
      byStatus,
      responseRate: Math.round(responseRate * 100) / 100,
      averageTimeToResponse: Math.round(averageTimeToResponse),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};