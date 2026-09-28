import express from 'express';
import {
  getAssetReport,
  getWarrantyReport,
  getMaintenanceReport,
  getHealthReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/assets', getAssetReport);
router.get('/warranty', getWarrantyReport);
router.get('/maintenance', getMaintenanceReport);
router.get('/health', getHealthReport);

export default router;
