import express from 'express';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getLocations);
router.post('/', authorizeRoles('ADMIN'), createLocation);
router.put('/:id', authorizeRoles('ADMIN'), updateLocation);
router.delete('/:id', authorizeRoles('ADMIN'), deleteLocation);

export default router;
