import ZKLib from "node-zklib";
import Attendance from "../models/attendanceModel.js";
import User from "../models/userModel.js";

// Machine IP Configuration
const MACHINE_IP = "192.168.0.194";
const MACHINE_PORT = 4370;

export const syncAttendance = async (req, res) => {
    let zkInstance = null;
    try {
        console.log(`🔌 Connecting to biometric device at ${MACHINE_IP}...`);

        zkInstance = new ZKLib(MACHINE_IP, MACHINE_PORT, 10000, 4000);

        // Create socket to machine
        await zkInstance.createSocket();

        console.log("✅ Connected to device. Fetching logs...");

        // Get all attendance logs
        const logs = await zkInstance.getAttendances();
        console.log(`📦 Fetched ${logs.length} logs from device.`);

        // Get current users with simple mapping { machine_user_id: user_pk_id }
        const users = await User.findAll({
            attributes: ['id', 'machine_user_id'],
            where: {
                machine_user_id: { [User.sequelize.Op.ne]: null }
            }
        });

        const userMap = {};
        users.forEach(u => {
            userMap[u.machine_user_id] = u.id;
        });

        let newRecords = 0;
        let errors = 0;

        for (const log of logs) {
            /* 
               log structure from node-zklib:
               {
                 deviceUserId: '1',
                 recordType: 0, // 0: Check-in, 1: Check-out, etc.
                 timestamp: 2023-10-27T08:00:00.000Z
               }
            */

            try {
                // Map to system User ID
                // Note: log.deviceUserId might be string or number, User.machine_user_id is Int.
                const deviceUserId = parseInt(log.deviceUserId, 10);
                const mappedUserId = userMap[deviceUserId] || null;

                await Attendance.findOrCreate({
                    where: {
                        machine_user_id: log.deviceUserId.toString(),
                        timestamp: log.recordTime // timestamp field name varies by library version, usually recordTime or timestamp
                    },
                    defaults: {
                        userId: mappedUserId,
                        status: log.recordType,
                        ip_address: MACHINE_IP
                    }
                });
                newRecords++;
            } catch (err) {
                // likely duplicate error if logic fails, ignore
                // console.error("Log error", err.message);
                errors++;
            }
        }

        // Disconnect
        await zkInstance.disconnect();

        console.log(`✅ Sync complete. Processed logs. New/Checked: ${newRecords}`);

        res.status(200).json({
            message: "Sync completed successfully",
            totalLogs: logs.length,
            processed: newRecords
        });

    } catch (error) {
        console.error("❌ Attendance Sync Error:", error);
        if (zkInstance) {
            try {
                await zkInstance.disconnect();
            } catch (e) { /* ignore disconnect error */ }
        }

        res.status(500).json({
            message: "Failed to sync with machine",
            error: error.message
        });
    }
};

export const getAttendanceLogs = async (req, res) => {
    try {
        const logs = await Attendance.findAll({
            include: [{
                model: User,
                attributes: ['full_name', 'employee_id']
            }],
            order: [['timestamp', 'DESC']]
        });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
};
