import { Response } from 'express';
import { z } from 'zod';
import prisma from '../db/client';
import { AuthRequest } from '../middleware/auth';

const createInterviewSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['phone', 'video', 'onsite', 'technical']),
  notes: z.string().optional(),
});

export const getInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;

    // Check if job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: req.userId,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: { jobApplicationId: jobId },
      orderBy: { date: 'asc' },
    });

    res.json(interviews);
  } catch (error) {
    throw error;
  }
};

export const createInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const data = createInterviewSchema.parse(req.body);

    // Check if job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: req.userId,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const interview = await prisma.interview.create({
      data: {
        jobApplicationId: jobId,
        date: new Date(data.date),
        type: data.type,
        notes: data.notes,
      },
    });

    res.status(201).json(interview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
};

export const updateInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const interviewId = Array.isArray(req.params.interviewId) ? req.params.interviewId[0] : req.params.interviewId;
    const data = createInterviewSchema.partial().parse(req.body);

    // Check if job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: req.userId,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Check if interview exists for this job
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        jobApplicationId: jobId,
      },
    });

    if (!existingInterview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: updateData,
    });

    res.json(interview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
};

export const deleteInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const interviewId = Array.isArray(req.params.interviewId) ? req.params.interviewId[0] : req.params.interviewId;

    // Check if job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: req.userId,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Check if interview exists for this job
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        jobApplicationId: jobId,
      },
    });

    if (!existingInterview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    await prisma.interview.delete({
      where: { id: interviewId },
    });

    res.status(204).send();
  } catch (error) {
    throw error;
  }
};