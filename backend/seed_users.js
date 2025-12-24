
import { sequelize } from "./DB/DBconnection.js";
import User from "./models/userModel.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    console.error("❌ ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    process.exit(1);
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");

const encrypt = (text) => {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
        let encrypted = cipher.update(text.toString(), "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
        console.error("❌ Encryption error:", error.message);
        return null;
    }
};

const seedUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        await sequelize.sync({ force: true }); // Ensure tables exist and match model (Force recreate)

        const users = [
            {
                full_name: "Manager One",
                email: encrypt("manager@test.com"),
                cnic: encrypt("1234567890123"), // Login credential
                employee_id: "EMP001",
                role: "Manager",
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Test Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Employee",
                gender: "Male",
                dob: new Date(1990, 0, 1),
                degree: "BS",
                institute: "Test Institute",
                grade: "3.5",
                year: 2012,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 50000,
                has_disease: "No",
                password: encrypt("123456"),
                department: null // Manager has global access
            },
            {
                full_name: "Team Lead Dev",
                email: encrypt("lead@test.com"),
                cnic: encrypt("1234567890124"),
                employee_id: "EMP002",
                role: "Team Lead",
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Test Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Employee",
                gender: "Female",
                dob: new Date(1992, 0, 1),
                degree: "BS",
                institute: "Test Institute",
                grade: "3.5",
                year: 2014,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 40000,
                has_disease: "No",
                password: encrypt("123456"),
                department: "Development"
            },
            {
                full_name: "Employee Dev",
                email: encrypt("employee@test.com"),
                cnic: encrypt("1234567890125"),
                employee_id: "EMP003",
                role: "Employee",
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Test Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Employee",
                gender: "Male",
                dob: new Date(1995, 0, 1),
                degree: "BS",
                institute: "Test Institute",
                grade: "3.5",
                year: 2016,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 30000,
                has_disease: "No",
                password: encrypt("123456"),
                department: "Development"
            },
            {
                full_name: "Employee Marketing",
                email: encrypt("emp_marketing@test.com"),
                cnic: encrypt("1234567890126"),
                employee_id: "EMP004",
                role: "Employee",
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Test Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Employee",
                gender: "Female",
                dob: new Date(1996, 0, 1),
                degree: "BBA",
                institute: "Business School",
                grade: "3.5",
                year: 2017,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 30000,
                has_disease: "No",
                password: encrypt("123456"),
                department: "Marketing"
            },
            {
                full_name: "Team Lead Marketing",
                email: encrypt("lead_marketing@test.com"),
                cnic: encrypt("1234567890127"),
                employee_id: "EMP005",
                role: "Team Lead",
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Test Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Employee",
                gender: "Male",
                dob: new Date(1993, 0, 1),
                degree: "MBA",
                institute: "Business School",
                grade: "3.5",
                year: 2015,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 45000,
                has_disease: "No",
                password: encrypt("123456"),
                department: "Marketing"
            },
            {
                full_name: "Admin User",
                email: encrypt("admin@techmire.com"),
                cnic: encrypt("1234567890000"),
                employee_id: "ADMIN01",
                role: "Employee", // Or Manager, depending on desired access
                contact_number: encrypt("0000000000"),
                permanent_address: encrypt("Admin Address"),
                guardian_phone: encrypt("0000000000"),
                registration_date: new Date(),
                joining_date: new Date(),
                post_applied_for: "Admin",
                gender: "Male",
                dob: new Date(1990, 0, 1),
                degree: "BS",
                institute: "Techmire",
                grade: "4.0",
                year: 2020,
                in_time: "09:00:00",
                out_time: "17:00:00",
                Salary_Cap: 100000,
                has_disease: "No",
                password: encrypt("123"), // The password they are trying
                department: "Development"
            }
        ];

        for (const user of users) {
            await User.create(user);
        }

        console.log("✅ Seeded 3 users");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedUsers();
