import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { createDeal, getAllDeals } from "../controllers/deal.controllers.js";
const router = express.Router();

router.post('/hubspot/deals', checkAuth, createDeal)
router.get('/hubspot/deals', checkAuth, getAllDeals)

export default router