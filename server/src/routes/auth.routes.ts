import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), register);
authRouter.post('/login', validateRequest(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', me);
