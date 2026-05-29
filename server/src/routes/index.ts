import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { groupRouter } from './group.routes.js';
import { questionRouter } from './question.routes.js';
import { questionSetRouter } from './questionSet.routes.js';
import { submissionRouter } from './submission.routes.js';
import { gradingRouter } from './grading.routes.js';
import { leaderboardRouter } from './leaderboard.routes.js';
import { adminUserRouter } from './adminUser.routes.js';
import { userRouter } from './user.routes.js';
import { inviteRouter } from './invite.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);

apiRouter.use('/groups', groupRouter);
apiRouter.use('/question-sets', questionSetRouter);
apiRouter.use(questionRouter);
apiRouter.use(submissionRouter);
apiRouter.use(inviteRouter);

apiRouter.use(gradingRouter);
apiRouter.use(leaderboardRouter);

apiRouter.use(userRouter);

apiRouter.use('/admin', adminUserRouter);
