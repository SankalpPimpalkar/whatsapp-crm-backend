import express from "express";
import { createTicket } from "../controllers/ticket.controllers.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Routes
router.post('/hubspot/tickets', checkAuth, createTicket);

export default router;