import { Router } from 'express';
import { acceptByToken, createForGroup, getByToken, listForGroup, listMinePending, revoke } from '../controllers/invite.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { acceptInviteByTokenSchema, createInviteSchema, getInviteByTokenSchema, listInvitesSchema, revokeInviteSchema } from '../validators/invite.validators.js';

export const inviteRouter = Router();

inviteRouter.get('/groups/:groupId/invites', requireAuth, validateRequest(listInvitesSchema), listForGroup);
inviteRouter.post('/groups/:groupId/invites', requireAuth, validateRequest(createInviteSchema), createForGroup);
inviteRouter.post('/invites/:inviteId/revoke', requireAuth, validateRequest(revokeInviteSchema), revoke);
inviteRouter.get('/invites/me/pending', requireAuth, listMinePending);
inviteRouter.get('/invites/token/:token', validateRequest(getInviteByTokenSchema), getByToken);
inviteRouter.post('/invites/token/:token/accept', requireAuth, validateRequest(acceptInviteByTokenSchema), acceptByToken);
