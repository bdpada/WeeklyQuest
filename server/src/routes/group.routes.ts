import { Router } from 'express';
import {
  addMember,
  create,
  destroy,
  list,
  listMembers,
  removeMember,
  show,
  update,
} from '../controllers/group.controller.js';
import { create as createQuestionSet, listForGroup as listQuestionSetsForGroup } from '../controllers/questionSet.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import {
  addMemberSchema,
  createGroupSchema,
  groupIdParamSchema,
  memberParamSchema,
  updateGroupSchema,
} from '../validators/group.validator.js';
import { createQuestionSetSchema, groupQuestionSetsSchema } from '../validators/questionSet.validator.js';

export const groupRouter = Router();

groupRouter.use(requireAuth);

groupRouter.get('/', list);
groupRouter.post('/', validateRequest(createGroupSchema), create);
groupRouter.get('/:groupId', validateRequest(groupIdParamSchema), show);
groupRouter.put('/:groupId', validateRequest(updateGroupSchema), update);
groupRouter.delete('/:groupId', validateRequest(groupIdParamSchema), destroy);
groupRouter.get('/:groupId/members', validateRequest(groupIdParamSchema), listMembers);
groupRouter.post('/:groupId/members', validateRequest(addMemberSchema), addMember);
groupRouter.delete('/:groupId/members/:userId', validateRequest(memberParamSchema), removeMember);

groupRouter.get('/:groupId/question-sets', validateRequest(groupQuestionSetsSchema), listQuestionSetsForGroup);
groupRouter.post('/:groupId/question-sets', validateRequest(createQuestionSetSchema), createQuestionSet);
