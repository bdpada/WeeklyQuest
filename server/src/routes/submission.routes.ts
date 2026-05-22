import { Router } from 'express';
import { create, listForQuestionSet, mySubmission, show, submit, update } from '../controllers/submission.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { createSubmissionSchema, mySubmissionSchema, submissionIdParamSchema, submissionUpdateSchema } from '../validators/submission.validator.js';

export const submissionRouter = Router();
submissionRouter.use(requireAuth);
submissionRouter.get('/question-sets/:questionSetId/my-submission', validateRequest(mySubmissionSchema), mySubmission);
submissionRouter.post('/question-sets/:questionSetId/submissions', validateRequest(createSubmissionSchema), create);
submissionRouter.get('/question-sets/:questionSetId/submissions', validateRequest(mySubmissionSchema), listForQuestionSet);
submissionRouter.put('/submissions/:submissionId', validateRequest(submissionUpdateSchema), update);
submissionRouter.post('/submissions/:submissionId/submit', validateRequest(submissionIdParamSchema), submit);
submissionRouter.get('/submissions/:submissionId', validateRequest(submissionIdParamSchema), show);
