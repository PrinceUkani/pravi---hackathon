import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addComment,
  deleteTicket,
} from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTickets);
router.post('/', createTicket);

router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.post('/:id/comments', addComment);
router.delete('/:id', authorizeRoles('ADMIN'), deleteTicket);

export default router;
