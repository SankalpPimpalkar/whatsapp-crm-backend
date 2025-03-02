import express from "express";
import {
	authenticateUser,
	createUser,
} from "../controllers/auth.controllers.js";
const router = express.Router();

// Routes
router.post("/authenticate", authenticateUser);
router.post("/hubspot/auth", createUser);

export default router