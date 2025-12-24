import express from "express";
import { syncAttendance, getAttendanceLogs } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/sync", syncAttendance);
router.get("/", getAttendanceLogs);

export default router;
