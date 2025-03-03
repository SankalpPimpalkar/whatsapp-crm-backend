import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { createContact } from "../controllers/contact.controllers.js";

const router = express.Router();

router.post('/hubspot/contacts', checkAuth, createContact)

export default router