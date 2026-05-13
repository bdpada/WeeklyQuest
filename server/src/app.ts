import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(cors({ credentials: true, origin: env.CLIENT_ORIGIN }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRouter);

app.use(errorMiddleware);
