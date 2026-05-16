import { Router } from 'express';
import {
  create,
  createQuestionOption,
  destroy,
  destroyQuestionOption,
  update,
  updateQuestionOption,
} from '../controllers/question.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import {
  createOptionSchema,
  createQuestionSchema,
  optionIdParamSchema,
  questionIdParamSchema,
  updateOptionSchema,
  updateQuestionSchema,
} from '../validators/question.validator.js';

export const questionRouter = Router();

questionRouter.use(requireAuth);
questionRouter.post('/question-sets/:questionSetId/questions', validateRequest(createQuestionSchema), create);
questionRouter.put('/questions/:questionId', validateRequest(updateQuestionSchema), update);
questionRouter.delete('/questions/:questionId', validateRequest(questionIdParamSchema), destroy);
questionRouter.post('/questions/:questionId/options', validateRequest(createOptionSchema), createQuestionOption);
questionRouter.put('/options/:optionId', validateRequest(updateOptionSchema), updateQuestionOption);
questionRouter.delete('/options/:optionId', validateRequest(optionIdParamSchema), destroyQuestionOption);
