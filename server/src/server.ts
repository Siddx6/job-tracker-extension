import express, { Request, Response } from 'express'; // Added explicit imports to fix TS7016
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import jobsRoutes from './routes/jobsRoutes';
import interviewsRoutes from './routes/interviewsRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// Standard Node global 'process' is now recognized thanks to @types/node being in package.json
console.log("APP DATABASE URL:", process.env.DATABASE_URL);

const app = express();
// process.env is now typed correctly
const PORT = process.env.PORT || 3000;

// --- CORS CONFIGURATION ---
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // If request has no origin (like mobile/curl) or is from your allowed sources
    if (!origin || origin.startsWith('chrome-extension://') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
// --------------------------

app.use(express.json());

// Routes
// FIXED: Added Request and Response types to fix TS7006 (Implicit Any)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);

// Note: Ensure interviewsRoutes uses the correct base path as intended
app.use('/api/jobs', interviewsRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;