import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes';
import jobsRoutes from '../routes/jobsRoutes';
import interviewsRoutes from '../routes/interviewsRoutes';
import { errorHandler } from './errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS CONFIGURATION (Updated) ---
const corsOptions = {
  origin: [
    'http://localhost:5173', // For local development
    'chrome-extension://onccilohmmmbhhgplglibonkhokebjjc' //
  ],
  credentials: true
};

app.use(cors(corsOptions));
// ------------------------------------

app.use(express.json());

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/jobs', interviewsRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;