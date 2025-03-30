import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { createContactEmail } from "../controllers/email.controller.js";
const router = express.Router();

// Routes
router.post("/hubspot/contacts/send-email", checkAuth, createContactEmail);

export default router;
