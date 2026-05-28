import { Router } from 'express';
import { me, updateMyPassword, updateMyProfile } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { getMyProfileSchema, updateMyPasswordSchema, updateMyProfileSchema } from '../validators/user.validator.js';

export const userRouter = Router();

userRouter.use('/users/me', requireAuth);
userRouter.get('/users/me', validateRequest(getMyProfileSchema), me);
userRouter.put('/users/me/profile', validateRequest(updateMyProfileSchema), updateMyProfile);
userRouter.put('/users/me/password', validateRequest(updateMyPasswordSchema), updateMyPassword);
