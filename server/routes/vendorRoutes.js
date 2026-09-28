import express from 'express';
import {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getVendors);
router.post('/', authorizeRoles('ADMIN'), createVendor);
router.put('/:id', authorizeRoles('ADMIN'), updateVendor);
router.delete('/:id', authorizeRoles('ADMIN'), deleteVendor);

export default router;
