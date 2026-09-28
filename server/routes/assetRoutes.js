import express from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetHistory,
  transferAsset,
  retireAsset,
  disposeAsset,
  getAssetQR,
  exportAssetsCSV,
  importAssetsCSV,
} from '../controllers/assetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAssets);
router.post('/', authorizeRoles('ADMIN'), createAsset);

router.get('/export/csv', exportAssetsCSV);
router.post('/import/csv', authorizeRoles('ADMIN'), importAssetsCSV);

router.get('/:id', getAssetById);
router.put('/:id', authorizeRoles('ADMIN', 'TECHNICIAN'), updateAsset);
router.delete('/:id', authorizeRoles('ADMIN'), deleteAsset);

router.get('/:id/history', getAssetHistory);
router.post('/:id/transfer', authorizeRoles('ADMIN'), transferAsset);
router.post('/:id/retire', authorizeRoles('ADMIN', 'MANAGER'), retireAsset);
router.post('/:id/dispose', authorizeRoles('ADMIN'), disposeAsset);
router.get('/:id/qr', getAssetQR);

export default router;
