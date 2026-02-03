import { Router, Request, Response } from 'express';


import {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
} from '../controllers/interviewsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/:jobId/interviews', (req: Request, res: Response) => getInterviews(req as any, res));
router.post('/:jobId/interviews', (req: Request, res: Response) => createInterview(req as any, res));
router.put('/:jobId/interviews/:interviewId', (req: Request, res: Response) => updateInterview(req as any, res));
router.delete('/:jobId/interviews/:interviewId', (req: Request, res: Response) => deleteInterview(req as any, res));

export default router;