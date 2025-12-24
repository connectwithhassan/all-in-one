import { DataTypes } from "sequelize";
import { sequelize } from "../DB/DBconnection.js";
import User from "./userModel.js";

const Attendance = sequelize.define(
    "Attendance",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Nullable if machine ID doesn't match any user yet
            references: {
                model: User,
                key: 'id'
            },
            comment: "Foreign key to User table (mapped via machine_user_id)"
        },
        machine_user_id: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "User ID as received from the machine"
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: "Check-in/out time"
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Check-in type (0: Check-In, 1: Check-Out, etc. - depends on device)"
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "IP address of the source device"
        }
    },
    {
        timestamps: true,
        tableName: "attendances",
        // indexes: [
        //     {
        //         unique: true,
        //         fields: ['machine_user_id', 'timestamp'] // Prevent duplicate logs
        //     }
        // ]
    }
);

// Define Association
User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

Attendance.sync({ alter: true })
    .then(() => console.log("✅ Attendance table synced successfully"))
    .catch((err) => console.error("❌ Error syncing Attendance table:", err));

export default Attendance;
