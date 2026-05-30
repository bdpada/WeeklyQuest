import { Router } from 'express';
import { finalizeScoresHandler, gradeInputAnswerHandler, gradeOptionAnswersHandler, recalculateScoresHandler, setCorrectOptionHandler } from '../controllers/grading.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { gradeInputAnswerSchema, questionSetIdOnlySchema, setCorrectOptionSchema } from '../validators/grading.validator.js';

export const gradingRouter = Router();
gradingRouter.post(
  '/questions/:questionId/correct-option',
  requireAuth,
  validateRequest(setCorrectOptionSchema),
  setCorrectOptionHandler,
);
gradingRouter.put('/answers/:answerId/grade', requireAuth, validateRequest(gradeInputAnswerSchema), gradeInputAnswerHandler);
gradingRouter.post(
  '/question-sets/:questionSetId/grade-option-answers',
  requireAuth,
  validateRequest(questionSetIdOnlySchema),
  gradeOptionAnswersHandler,
);
gradingRouter.post(
  '/question-sets/:questionSetId/finalize-scores',
  requireAuth,
  validateRequest(questionSetIdOnlySchema),
  finalizeScoresHandler,
);
gradingRouter.post(
  '/question-sets/:questionSetId/recalculate-scores',
  requireAuth,
  validateRequest(questionSetIdOnlySchema),
  recalculateScoresHandler,
);
