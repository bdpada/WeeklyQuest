import { Router } from 'express';
import { addGroup, list, listGroups, removeGroup, show, updateRole, updateStatus } from '../controllers/adminUser.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.middleware.js';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import {
  addAdminUserGroupSchema,
  adminUserIdParamSchema,
  listAdminUsersSchema,
  removeAdminUserGroupSchema,
  updateAdminUserRoleSchema,
  updateAdminUserStatusSchema,
} from '../validators/adminUser.validator.js';

export const adminUserRouter = Router();

adminUserRouter.use(requireAuth, requireRole('ADMIN'));
adminUserRouter.get('/users', validateRequest(listAdminUsersSchema), list);
adminUserRouter.get('/users/:userId', validateRequest(adminUserIdParamSchema), show);
adminUserRouter.put('/users/:userId/role', validateRequest(updateAdminUserRoleSchema), updateRole);
adminUserRouter.put('/users/:userId/status', validateRequest(updateAdminUserStatusSchema), updateStatus);
adminUserRouter.get('/users/:userId/groups', validateRequest(adminUserIdParamSchema), listGroups);
adminUserRouter.post('/users/:userId/groups', validateRequest(addAdminUserGroupSchema), addGroup);
adminUserRouter.delete('/users/:userId/groups/:groupId', validateRequest(removeAdminUserGroupSchema), removeGroup);
