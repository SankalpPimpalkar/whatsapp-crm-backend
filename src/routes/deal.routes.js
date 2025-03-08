import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { createDeal } from "../controllers/deal.controllers.js";
const router = express.Router();

router.post('/hubspot/deals', checkAuth, createDeal)

export default router