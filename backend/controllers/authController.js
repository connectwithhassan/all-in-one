import { sequelize } from "../DB/DBconnection.js"
import { QueryTypes } from "sequelize"
import HrUser from "../models/hrUsers.js"
import crypto from "crypto"
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

// 🔐 Import encryption functions from userController
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = "aes-256-cbc"

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("❌ ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  process.exit(1)
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex")

// ✅ Decryption function for employee data
const decrypt = (text) => {
  if (!text || typeof text !== "string") return null
  try {
    // Check if the text is already in encrypted format (contains ":")
    if (!text.includes(":")) {
      return text // Return as-is if not encrypted
    }

    const textParts = text.split(":")
    if (textParts.length !== 2) return text

    const iv = Buffer.from(textParts[0], "hex")
    const encryptedText = textParts[1]

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv)
    let decrypted = decipher.update(encryptedText, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (error) {
    console.error("❌ Decryption error:", error.message)
    return text // Return original text if decryption fails
  }
}

// ✅ Find employee by email and CNIC (decrypt and compare)
// ✅ Find employee by email and password (decrypt and compare)
const findEmployeeByCredentials = async (email, password) => {
  try {
    const users = await sequelize.query("SELECT * FROM users", { type: QueryTypes.SELECT })

    for (const user of users) {
      const decryptedEmail = decrypt(user.email);
      // const decryptedCnic = decrypt(user.cnic); // No longer needed for login
      let decryptedPassword;
      if (user.password) {
        decryptedPassword = decrypt(user.password);
      } else {
        // If no password set (legacy), maybe allow login if password input is empty? 
        // No, requirement is strict password. 
        // Seed will provide passwords.
        decryptedPassword = null;
      }

      // console.log(`Checking user: ${decryptedEmail} | Pass: ${decryptedPassword ? '***' : 'null'}`);

      const normalize = (str) => str ? str.toString().trim().toLowerCase() : "";
      // const normalizeCnic = (str) => str ? str.toString().replace(/[^0-9]/g, "") : "";

      if (normalize(decryptedEmail) === normalize(email)) {
        // Check password
        if (decryptedPassword === password) {
          return user;
        }
      }
    }
    return null
  } catch (error) {
    console.error("❌ Error finding employee:", error.message)
    return null
  }
}

export const authController = {
  // ✅ Enhanced login with proper encryption handling
  login: async (req, res) => {
    const { stakeholder, email, cnic, password } = req.body

    try {
      if (stakeholder === "employee") {
        if (!email || !password) {
          return res.status(400).json({ message: "Email and Password are required for login" })
        }

        console.log("🔍 Searching for employee with encrypted data...")

        // Find employee by decrypting and comparing credentials
        const user = await findEmployeeByCredentials(email, password)

        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" })
        }

        console.log("✅ Employee found, decrypting data for response...")

        // Decrypt sensitive data for response
        const decryptedUser = {
          id: user.id,
          employee_id: user.employee_id,
          registration_date: user.registration_date,
          joining_date: user.joining_date,
          post_applied_for: user.post_applied_for,
          full_name: user.full_name,
          gender: user.gender,
          cnic: decrypt(user.cnic) || user.cnic,
          dob: user.dob,
          permanent_address: decrypt(user.permanent_address) || user.permanent_address,
          contact_number: decrypt(user.contact_number) || user.contact_number,
          email: decrypt(user.email) || user.email,
          degree: user.degree,
          institute: user.institute,
          grade: user.grade,
          year: user.year,
          teaching_subjects: user.teaching_subjects,
          teaching_institute: user.teaching_institute,
          teaching_contact: user.teaching_contact ? decrypt(user.teaching_contact) : null,
          position: user.position,
          organization: user.organization,
          skills: user.skills,
          description: user.description,
          in_time: user.in_time,
          out_time: user.out_time,
          Salary_Cap: user.Salary_Cap,
          role: user.role || "Employee",
          guardian_phone: decrypt(user.guardian_phone) || user.guardian_phone,
          reference_name: user.reference_name,
          reference_contact: user.reference_contact ? decrypt(user.reference_contact) : null,
          has_disease: user.has_disease,
          disease_description: user.disease_description,
          department: user.department,
        }

        // Handle image conversion
        let imageBase64 = null
        if (user.image) {
          imageBase64 = Buffer.from(user.image).toString("base64")
          decryptedUser.image = `data:image/jpeg;base64,${imageBase64}`
        } else {
          decryptedUser.image = null
        }

        // Mask CNIC for security in response
        if (decryptedUser.cnic && decryptedUser.cnic.length >= 4) {
          decryptedUser.cnic_display = `****-****-${decryptedUser.cnic.slice(-4)}`
          decryptedUser.cnic = decryptedUser.cnic_display // Replace full CNIC with masked version
        }

        return res.status(200).json({
          message: "Employee login successful",
          user: decryptedUser,
        })
      } else if (stakeholder === "hr") {
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required for HR login" })
        }

        console.log("🔍 Authenticating HR user...")

        // Find HR user by email
        const hr = await HrUser.findOne({ where: { email } })
        if (!hr) {
          return res.status(401).json({ message: "Invalid HR email or password" })
        }

        // Verify password using the instance method
        const isPasswordValid = hr.verifyPassword(password)
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid HR email or password" })
        }

        console.log("✅ HR authentication successful")

        return res.status(200).json({
          message: "HR login successful",
          user: {
            id: hr.id,
            role: "hr",
            email: hr.email,
          },
        })
      } else if (stakeholder === "superadmin") {
        if (!password) {
          return res.status(400).json({ message: "Password is required for Super Admin login" })
        }

        // Use environment variable for Super Admin password
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
        if (password !== superAdminPassword) {
          return res.status(401).json({ message: "Invalid Super Admin password" })
        }

        console.log("✅ Super Admin authentication successful")

        return res.status(200).json({
          message: "Super Admin login successful",
          user: { role: "superadmin" },
        })
      } else {
        return res.status(400).json({ message: "Invalid stakeholder type" })
      }
    } catch (error) {
      console.error("❌ Login error:", error.stack)
      return res.status(500).json({ message: "Internal server error" })
    }
  },

  // ✅ Enhanced HR creation with password hashing
  createHr: async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" })
    }

    try {
      console.log("🔍 Checking for existing HR user...")

      const existingHr = await HrUser.findOne({ where: { email } })
      if (existingHr) {
        return res.status(400).json({ message: "HR email already exists" })
      }

      console.log("🔐 Creating HR user with hashed password...")

      // Password will be automatically hashed by the beforeCreate hook
      const newHr = await HrUser.create({ email, password })

      console.log("✅ HR user created successfully")

      return res.status(201).json({
        message: "HR/Employer created successfully",
        hr: {
          id: newHr.id,
          email: newHr.email,
          createdAt: newHr.createdAt,
        },
      })
    } catch (error) {
      console.error("❌ Create HR error:", error.stack)
      return res.status(500).json({ message: "Failed to create HR/Employer" })
    }
  },

  // ✅ Enhanced HR deletion
  deleteHr: async (req, res) => {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    try {
      console.log(`🗑️ Deleting HR user: ${email}`)

      const hr = await HrUser.findOne({ where: { email } })
      if (!hr) {
        return res.status(404).json({ message: "HR/Employer not found" })
      }

      await hr.destroy()

      console.log("✅ HR user deleted successfully")

      return res.status(200).json({ message: "HR/Employer deleted successfully" })
    } catch (error) {
      console.error("❌ Delete HR error:", error.stack)
      return res.status(500).json({ message: "Failed to delete HR/Employer" })
    }
  },

  // ✅ Enhanced HR list retrieval
  getHrList: async (req, res) => {
    try {
      console.log("📋 Fetching HR users list...")

      const hrList = await HrUser.findAll({
        attributes: ["id", "email", "createdAt"],
        order: [["createdAt", "DESC"]],
      })

      console.log(`✅ Found ${hrList.length} HR users`)

      return res.status(200).json({
        hrList: hrList.map((hr) => ({
          id: hr.id,
          email: hr.email,
          createdAt: hr.createdAt,
        })),
      })
    } catch (error) {
      console.error("❌ Get HR list error:", error.stack)
      return res.status(500).json({ message: "Failed to fetch HR list" })
    }
  },

  // ✅ Enhanced user profile with decryption
  getUserProfile: async (req, res) => {
    const { id } = req.params

    try {
      console.log(`🔍 Fetching user profile for ID: ${id}`)

      const users = await sequelize.query("SELECT * FROM users WHERE id = :id", {
        replacements: { id },
        type: QueryTypes.SELECT,
      })

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" })
      }

      const user = users[0]

      console.log("🔓 Decrypting user data...")

      // Decrypt sensitive data for response
      const decryptedUser = {
        id: user.id,
        employee_id: user.employee_id,
        registration_date: user.registration_date,
        joining_date: user.joining_date,
        post_applied_for: user.post_applied_for,
        full_name: user.full_name,
        gender: user.gender,
        cnic: decrypt(user.cnic) || user.cnic,
        dob: user.dob,
        permanent_address: decrypt(user.permanent_address) || user.permanent_address,
        contact_number: decrypt(user.contact_number) || user.contact_number,
        email: decrypt(user.email) || user.email,
        degree: user.degree,
        institute: user.institute,
        grade: user.grade,
        year: user.year,
        teaching_subjects: user.teaching_subjects,
        teaching_institute: user.teaching_institute,
        teaching_contact: user.teaching_contact ? decrypt(user.teaching_contact) : null,
        position: user.position,
        organization: user.organization,
        skills: user.skills,
        description: user.description,
        in_time: user.in_time,
        out_time: user.out_time,
        Salary_Cap: user.Salary_Cap,
        role: "employee",
        guardian_phone: decrypt(user.guardian_phone) || user.guardian_phone,
        reference_name: user.reference_name,
        reference_contact: user.reference_contact ? decrypt(user.reference_contact) : null,
        has_disease: user.has_disease,
        disease_description: user.disease_description,
      }

      // Handle image conversion
      let imageBase64 = null
      if (user.image) {
        imageBase64 = Buffer.from(user.image).toString("base64")
        decryptedUser.image = `data:image/jpeg;base64,${imageBase64}`
      } else {
        decryptedUser.image = null
      }

      // Mask CNIC for security
      if (decryptedUser.cnic && decryptedUser.cnic.length >= 4) {
        decryptedUser.cnic_display = `****-****-${decryptedUser.cnic.slice(-4)}`
        decryptedUser.cnic = decryptedUser.cnic_display
      }

      console.log("✅ User profile retrieved and decrypted successfully")

      return res.status(200).json({
        user: decryptedUser,
      })
    } catch (error) {
      console.error("❌ Get profile error:", error.stack)
      return res.status(500).json({ message: "Internal server error" })
    }
  },

  // ✅ Password change for HR users
  changeHrPassword: async (req, res) => {
    const { email, currentPassword, newPassword } = req.body

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Email, current password, and new password are required" })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" })
    }

    try {
      console.log(`🔄 Changing password for HR user: ${email}`)

      const hr = await HrUser.findOne({ where: { email } })
      if (!hr) {
        return res.status(404).json({ message: "HR user not found" })
      }

      // Verify current password
      const isCurrentPasswordValid = hr.verifyPassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" })
      }

      // Update password (will be automatically hashed by beforeUpdate hook)
      await hr.update({ password: newPassword })

      console.log("✅ HR password changed successfully")

      return res.status(200).json({ message: "Password changed successfully" })
    } catch (error) {
      console.error("❌ Change password error:", error.stack)
      return res.status(500).json({ message: "Failed to change password" })
    }
  },
}
