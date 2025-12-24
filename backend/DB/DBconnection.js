import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// SQLite Connection
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // Local file for the database
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ SQLite Database Connected Successfully");

    await sequelize.sync();
    console.log("✅ Database models synced (tables created if needed)");
  } catch (error) {
    console.error("❌ SQLite Connection Failed:", error.message);
    process.exit(1);
  }
};

connectDB();

export { sequelize, connectDB };
