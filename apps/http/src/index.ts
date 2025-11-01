import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server is running on http://localhost:${config.port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;