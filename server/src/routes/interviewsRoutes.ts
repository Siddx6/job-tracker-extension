import { Router } from 'express';
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

router.get('/:jobId/interviews', getInterviews);
router.post('/:jobId/interviews', createInterview);
router.put('/:jobId/interviews/:interviewId', updateInterview);
router.delete('/:jobId/interviews/:interviewId', deleteInterview);

export default router;