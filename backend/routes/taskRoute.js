import express from "express";
import { taskController } from "../controllers/taskController.js";

const router = express.Router();

router.post("/create", taskController.createTask);
router.get("/all", taskController.getAllTasks); // Pass user_id and role as query params
router.put("/update/:id", taskController.updateTask);
router.delete("/delete/:id", taskController.deleteTask);

export default router;
