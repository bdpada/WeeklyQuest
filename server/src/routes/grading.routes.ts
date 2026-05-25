import { Router } from 'express';
import { finalizeScoresHandler, gradeInputAnswerHandler, gradeOptionAnswersHandler, recalculateScoresHandler, setCorrectOptionHandler } from '../controllers/grading.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { gradeInputAnswerSchema, questionSetIdOnlySchema, setCorrectOptionSchema } from '../validators/grading.validator.js';

export const gradingRouter = Router();
gradingRouter.use(requireAuth);
gradingRouter.post('/questions/:questionId/correct-option', validateRequest(setCorrectOptionSchema), setCorrectOptionHandler);
gradingRouter.put('/answers/:answerId/grade', validateRequest(gradeInputAnswerSchema), gradeInputAnswerHandler);
gradingRouter.post('/question-sets/:questionSetId/grade-option-answers', validateRequest(questionSetIdOnlySchema), gradeOptionAnswersHandler);
gradingRouter.post('/question-sets/:questionSetId/finalize-scores', validateRequest(questionSetIdOnlySchema), finalizeScoresHandler);
gradingRouter.post('/question-sets/:questionSetId/recalculate-scores', validateRequest(questionSetIdOnlySchema), recalculateScoresHandler);
