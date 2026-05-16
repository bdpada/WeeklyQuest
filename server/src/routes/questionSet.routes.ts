import { Router } from 'express';
import { archive, lock, publish, show, update } from '../controllers/questionSet.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { questionSetIdParamSchema, updateQuestionSetSchema } from '../validators/questionSet.validator.js';

export const questionSetRouter = Router();

questionSetRouter.use(requireAuth);
questionSetRouter.get('/:questionSetId', validateRequest(questionSetIdParamSchema), show);
questionSetRouter.put('/:questionSetId', validateRequest(updateQuestionSetSchema), update);
questionSetRouter.post('/:questionSetId/publish', validateRequest(questionSetIdParamSchema), publish);
questionSetRouter.post('/:questionSetId/lock', validateRequest(questionSetIdParamSchema), lock);
questionSetRouter.post('/:questionSetId/archive', validateRequest(questionSetIdParamSchema), archive);
