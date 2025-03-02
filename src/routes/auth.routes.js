import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import {
	authenticateUser,
	createUser,
} from "../controllers/auth.controllers.js";
const router = express.Router();


// Routes
router.post("/authenticate",checkAuth, authenticateUser);
router.get("/hubspot/auth", createUser);

export default router