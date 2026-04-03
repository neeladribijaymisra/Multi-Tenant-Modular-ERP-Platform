import { Router } from "express";
import { chatbotQuery } from "../controllers/chatbot.controller.js";

const router = Router({ mergeParams: true });

router.post("/query", chatbotQuery);

export default router;