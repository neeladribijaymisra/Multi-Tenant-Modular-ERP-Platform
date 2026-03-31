import { Router } from "express";

import { login } from "../controllers/auth.controller.js";

const router = Router({ mergeParams: true });

router.post("/login", login);

export default router;
