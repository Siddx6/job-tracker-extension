import { Response } from 'express';
import { z } from 'zod';
import prisma from '../db/client';
import { AuthRequest } from '../middleware/auth';

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

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, limit, offset } = req.query;

    const where: any = {
      userId: req.userId,
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
    throw error;
  }
};

export const getJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

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
    throw error;
  }
};

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createJobSchema.parse(req.body);

    const job = await prisma.jobApplication.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateJobSchema.parse(req.body);

    // Check if job belongs to user
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
    throw error;
  }
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if job belongs to user
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
    throw error;
  }
};

export const getJobStats = async (req: AuthRequest, res: Response): Promise<void> => {
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
    
    jobs.forEach((job: { status: string; dateAdded: Date; dateApplied: Date | null; }) => {
      byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    });

    const responseRate = total > 0 
      ? ((byStatus.interviewing || 0) + (byStatus.offer || 0)) / total 
      : 0;

    // Calculate average time to response
    let totalDays = 0;
    let respondedCount = 0;
    
    jobs.forEach((job: { status: string; dateAdded: Date; dateApplied: Date | null; }) => {
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
    throw error;
  }
};

