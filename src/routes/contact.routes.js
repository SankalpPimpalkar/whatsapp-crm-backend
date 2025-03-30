import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import {
	createContact,
	getAllContacts,
} from "../controllers/contact.controllers.js";

const router = express.Router();

// Routes
router.post("/hubspot/contacts", checkAuth, createContact);
router.get("/hubspot/contacts", checkAuth, getAllContacts);

export default router;
