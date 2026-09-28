import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('ADMIN', 'MANAGER'));

router.get('/', getAuditLogs);

export default router;
