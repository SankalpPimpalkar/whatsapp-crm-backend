import express from "express";
import { createTask } from "../controllers/task.controllers.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/hubspot/tasks", checkAuth, createTask);

export default router;
