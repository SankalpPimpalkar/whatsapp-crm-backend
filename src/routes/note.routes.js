import express from "express";
import { createNote } from "../controllers/note.controllers.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/hubspot/notes", checkAuth, createNote);

export default router;
