import { Request, Response } from 'express'; // Standard Request
import { z } from 'zod';
import prisma from '../db/client';
import { asString } from "../utils/params";

const createInterviewSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['phone', 'video', 'onsite', 'technical']),
  notes: z.string().optional(),
});

export const getInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = asString(req.params.jobId);

    // Check if job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: req.userId, // This works via global augmentation
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = asString(req.params.jobId);
    const data = createInterviewSchema.parse(req.body);

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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = asString(req.params.jobId);
    const interviewId = asString(req.params.interviewId);
    const data = createInterviewSchema.partial().parse(req.body);

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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = asString(req.params.jobId);
    const interviewId = asString(req.params.interviewId);

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
    res.status(500).json({ error: 'Internal server error' });
  }
};