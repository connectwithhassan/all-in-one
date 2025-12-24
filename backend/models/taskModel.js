import { DataTypes } from "sequelize";
import { sequelize } from "../DB/DBconnection.js";
import User from "./userModel.js";

const Task = sequelize.define(
    "Task",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
            defaultValue: "Medium",
        },
        status: {
            type: DataTypes.ENUM("Pending", "In Progress", "Completed", "Overdue"),
            defaultValue: "Pending",
        },
        assigned_to: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        assigned_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
    },
    {
        timestamps: true,
        tableName: "tasks",
    }
);

// Associations
User.hasMany(Task, { foreignKey: "assigned_to", as: "receivedTasks" });
User.hasMany(Task, { foreignKey: "assigned_by", as: "createdTasks" });
Task.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
Task.belongsTo(User, { foreignKey: "assigned_by", as: "creator" });

export default Task;
