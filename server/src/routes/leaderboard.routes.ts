import { Router } from 'express';
import { groupLeaderboard, myScoreHistory, questionSetLeaderboard } from '../controllers/leaderboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { groupIdParamSchema } from '../validators/group.validator.js';
import { questionSetIdParamSchema } from '../validators/questionSet.validator.js';

export const leaderboardRouter = Router();

leaderboardRouter.use(requireAuth);
leaderboardRouter.get('/question-sets/:questionSetId/leaderboard', validateRequest(questionSetIdParamSchema), questionSetLeaderboard);
leaderboardRouter.get('/groups/:groupId/leaderboard', validateRequest(groupIdParamSchema), groupLeaderboard);
leaderboardRouter.get('/users/me/scores', myScoreHistory);
