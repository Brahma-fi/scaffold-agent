import express, { Express } from "express";
import { chatWithAgent } from "../controller";

const router = express.Router();

router.post("/chat", chatWithAgent);

export default router;
