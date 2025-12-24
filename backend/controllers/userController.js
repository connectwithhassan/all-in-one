// controllers/userController.js
import User from "../models/userModel.js"
import ExEmployee from "../models/exEmployeeModel.js"
import crypto from "crypto"

// 🔐 Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = "aes-256-cbc"

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("❌ ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  process.exit(1)
}

// Convert hex string to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex")

// ✅ SIMPLE & RELIABLE encryption/decryption functions
const encrypt = (text) => {
  if (!text) return null
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv)
    let encrypted = cipher.update(text.toString(), "utf8", "hex")
    encrypted += cipher.final("hex")
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("❌ Encryption error:", error.message)
    return null
  }
}

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

// ✅ Hash sensitive data (one-way hashing for duplicate checking)
const hashData = (data) => {
  if (!data) return null
  return crypto.createHash("sha256").update(data.toString()).digest("hex")
}

// ✅ Check if email already exists (by trying to decrypt and compare)
const checkEmailExists = async (email) => {
  try {
    const users = await User.findAll({ attributes: ["id", "email"] })
    for (const user of users) {
      const decryptedEmail = decrypt(user.email)
      if (decryptedEmail === email) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error("❌ Error checking email existence:", error.message)
    return false
  }
}

// ✅ Check if CNIC already exists (by trying to decrypt and compare)
const checkCnicExists = async (cnic) => {
  try {
    const users = await User.findAll({ attributes: ["id", "cnic"] })
    for (const user of users) {
      const decryptedCnic = decrypt(user.cnic)
      if (decryptedCnic === cnic) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error("❌ Error checking CNIC existence:", error.message)
    return false
  }
}

// ✅ Fetch all users (decrypt sensitive data for display)
export const getUsers = async (req, res) => {
  try {
    console.log("🔍 Fetching all users...")
    const users = await User.findAll()

    // Convert binary image data to base64 and decrypt sensitive data
    const usersWithDecryptedData = users.map((user) => {
      const userData = user.toJSON()

      // Decrypt sensitive fields for display
      const decryptedData = {
        ...userData,
        email: decrypt(userData.email) || userData.email,
        contact_number: decrypt(userData.contact_number) || userData.contact_number,
        guardian_phone: decrypt(userData.guardian_phone) || userData.guardian_phone,
        permanent_address: decrypt(userData.permanent_address) || userData.permanent_address,
        cnic: decrypt(userData.cnic) || userData.cnic,
        reference_contact: userData.reference_contact ? decrypt(userData.reference_contact) : null,
        teaching_contact: userData.teaching_contact ? decrypt(userData.teaching_contact) : null,

        // Convert image to base64 if exists
        image: userData.image ? `data:image/jpeg;base64,${userData.image.toString("base64")}` : null,
      }

      // Show masked CNIC for security in responses
      if (decryptedData.cnic && decryptedData.cnic.length >= 4) {
        decryptedData.cnic_display = `****-****-${decryptedData.cnic.slice(-4)}`
      }

      return decryptedData
    })

    console.log(`✅ Successfully fetched ${usersWithDecryptedData.length} users`)
    res.status(200).json(usersWithDecryptedData)
  } catch (error) {
    console.error("❌ Fetch error:", error.stack)
    res.status(500).json({ message: "Server Error", error: error.message })
  }
}

// ✅ Register a new user (encrypt sensitive data)
export const registerUser = async (req, res) => {
  try {
    console.log("📝 Starting user registration...")

    // Destructure user data from request body
    const {
      employee_id,
      registration_date,
      joining_date,
      post_applied_for,
      full_name,
      gender,
      cnic,
      dob,
      permanent_address,
      contact_number,
      email,
      degree,
      institute,
      grade,
      year,
      teaching_subjects,
      teaching_institute,
      teaching_contact,
      position,
      organization,
      skills,
      description,
      in_time,
      out_time,
      Salary_Cap,
      guardian_phone,
      reference_name,
      reference_contact,
      has_disease,
      disease_description,
      department, // Added department
    } = req.body

    // Define required fields and validate their presence
    const requiredFields = {
      employee_id,
      registration_date,
      joining_date,
      post_applied_for,
      full_name,
      gender,
      cnic,
      dob,
      permanent_address,
      contact_number,
      email,
      degree,
      institute,
      grade,
      year,
      in_time,
      out_time,
      Salary_Cap,
      guardian_phone,
      has_disease,
    }

    // Department is required for 'Employee' and 'Team Lead' roles if they are being registered via this flow?
    // The role isn't explicitly passed in registerUser (it defaults to Employee in model, later updated or maybe passed in body but ignored in destructuring earlier).
    // Actually `role` isn't in Destructuring of registerUser (line 144+).
    // But `User.create` uses default.
    // I should check if I need to add department to requiredFields.
    // For now, I'll make it optional in validation but validation logic for specific roles usually happens.
    // Given the prompt "defined at the time of registraton", I should probably save it.

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ message: `${key} is required` })
      }
    }

    // Validate disease_description if has_disease is "Yes"
    if (has_disease === "Yes" && (!disease_description || disease_description.trim() === "")) {
      return res.status(400).json({ message: "Disease description is required when has_disease is 'Yes'" })
    }

    // Validate image format (only JPEG allowed)
    if (req.file && req.file.mimetype !== "image/jpeg") {
      return res.status(400).json({ message: "Only JPEG images are allowed." })
    }
    const image = req.file ? req.file.buffer : null

    console.log("🔍 Checking for existing users...")

    // Check if user with this email already exists
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      return res.status(400).json({ message: "User with this email already exists" })
    }

    // Check if user with this CNIC already exists
    const cnicExists = await checkCnicExists(cnic)
    if (cnicExists) {
      return res.status(400).json({ message: "User with this CNIC already exists" })
    }

    // Parse skills safely into an array
    let parsedSkills = null
    if (skills) {
      try {
        parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills
        if (!Array.isArray(parsedSkills) || parsedSkills.length > 5) {
          return res.status(400).json({ message: "Skills must be an array with a maximum of 5 items" })
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid skills format", error: error.message })
      }
    }

    // Format dates to ensure valid Date objects
    const formattedRegistrationDate = new Date(registration_date)
    const formattedJoiningDate = new Date(joining_date)
    const formattedDob = new Date(dob)

    // Validate date formats
    if (
      isNaN(formattedRegistrationDate.getTime()) ||
      isNaN(formattedJoiningDate.getTime()) ||
      isNaN(formattedDob.getTime())
    ) {
      return res.status(400).json({ message: "Invalid date format" })
    }

    console.log("🔐 Encrypting sensitive data...")

    // 🔐 ENCRYPT SENSITIVE DATA
    const encryptedEmail = encrypt(email)
    const encryptedCnic = encrypt(cnic)
    const encryptedContactNumber = encrypt(contact_number)
    const encryptedGuardianPhone = encrypt(guardian_phone)
    const encryptedPermanentAddress = encrypt(permanent_address)
    const encryptedReferenceContact = reference_contact ? encrypt(reference_contact) : null
    const encryptedTeachingContact = teaching_contact ? encrypt(teaching_contact) : null

    // Validate encryption success
    if (
      !encryptedEmail ||
      !encryptedCnic ||
      !encryptedContactNumber ||
      !encryptedGuardianPhone ||
      !encryptedPermanentAddress
    ) {
      return res.status(500).json({ message: "Failed to encrypt sensitive data" })
    }

    console.log("💾 Creating user in database...")

    // Create a new user in the database with encrypted data
    const newUser = await User.create({
      employee_id,
      registration_date: formattedRegistrationDate,
      joining_date: formattedJoiningDate,
      post_applied_for,
      full_name,
      gender,
      cnic: encryptedCnic, // Store encrypted CNIC
      email: encryptedEmail, // Store encrypted email
      dob: formattedDob,
      permanent_address: encryptedPermanentAddress,
      contact_number: encryptedContactNumber,
      guardian_phone: encryptedGuardianPhone,
      reference_contact: encryptedReferenceContact,
      teaching_contact: encryptedTeachingContact,
      image,
      degree,
      institute,
      grade,
      year: Number.parseInt(year, 10),
      teaching_subjects: teaching_subjects || null,
      teaching_institute: teaching_institute || null,
      position: position || null,
      organization: organization || null,
      skills: parsedSkills,
      description: description || null,
      in_time,
      out_time,
      Salary_Cap: Number.parseInt(Salary_Cap, 10),
      reference_name: reference_name || null,
      has_disease,
      disease_description: disease_description || null,
      department: department || null,
    })

    // Return user data with original (decrypted) fields for response
    const responseUser = {
      ...newUser.toJSON(),
      email: email, // Return original email in response
      cnic: `****-****-${cnic.slice(-4)}`, // Masked CNIC for security
      contact_number: contact_number,
      guardian_phone: guardian_phone,
      permanent_address: permanent_address,
      reference_contact: reference_contact,
      teaching_contact: teaching_contact,
    }

    console.log("✅ User registered successfully with encrypted data")
    res.status(201).json({ message: "User registered successfully", user: responseUser })
  } catch (error) {
    console.error("❌ Registration error:", error.stack)
    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Validation error",
        error: error.errors.map((e) => e.message).join(", "),
      })
    }
    res.status(500).json({ message: "Registration failed", error: error.message })
  }
}

// ✅ Update user by ID (handle encrypted data)
export const updateUser = async (req, res) => {
  try {
    console.log(`🔄 Updating user with ID: ${req.params.id}`)

    // Find user by primary key (ID)
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })

    // Destructure updated data from request body
    const {
      employee_id,
      registration_date,
      joining_date,
      post_applied_for,
      full_name,
      gender,
      cnic,
      dob,
      permanent_address,
      contact_number,
      email,
      degree,
      institute,
      grade,
      year,
      teaching_subjects,
      teaching_institute,
      teaching_contact,
      position,
      organization,
      skills,
      description,
      in_time,
      out_time,
      Salary_Cap,
      guardian_phone,
      reference_name,
      reference_contact,
      has_disease,
      disease_description,
      role,
      department,
    } = req.body

    // Validate image format if provided
    if (req.file && req.file.mimetype !== "image/jpeg") {
      return res.status(400).json({ message: "Only JPEG images are allowed." })
    }
    const image = req.file ? req.file.buffer : user.image

    // Validate disease_description if has_disease is "Yes"
    if (has_disease === "Yes" && (!disease_description || disease_description.trim() === "")) {
      return res.status(400).json({ message: "Disease description is required when has_disease is 'Yes'" })
    }

    // Parse skills safely
    let parsedSkills = user.skills
    if (skills) {
      try {
        parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills
        if (!Array.isArray(parsedSkills) || parsedSkills.length > 5) {
          return res.status(400).json({ message: "Skills must be an array with a maximum of 5 items" })
        }
      } catch (error) {
        parsedSkills = skills.split(",").map((skill) => skill.trim())
        if (parsedSkills.length > 5) {
          return res.status(400).json({ message: "Skills must have a maximum of 5 items" })
        }
      }
    }

    // Format dates if provided
    const formattedRegistrationDate = registration_date ? new Date(registration_date) : user.registration_date
    const formattedJoiningDate = joining_date ? new Date(joining_date) : user.joining_date
    const formattedDob = dob ? new Date(dob) : user.dob

    // Validate date formats
    if (
      (registration_date && isNaN(formattedRegistrationDate.getTime())) ||
      (joining_date && isNaN(formattedJoiningDate.getTime())) ||
      (dob && isNaN(formattedDob.getTime()))
    ) {
      return res.status(400).json({ message: "Invalid date format" })
    }

    console.log("🔐 Processing sensitive data updates...")

    // 🔐 PREPARE UPDATE DATA WITH ENCRYPTION
    const updateData = {
      role: role || user.role,
      employee_id: employee_id || user.employee_id,
      registration_date: formattedRegistrationDate,
      joining_date: formattedJoiningDate,
      post_applied_for: post_applied_for || user.post_applied_for,
      full_name: full_name || user.full_name,
      gender: gender || user.gender,
      dob: formattedDob,
      image,
      degree: degree || user.degree,
      institute: institute || user.institute,
      grade: grade || user.grade,
      year: year ? Number.parseInt(year, 10) : user.year,
      teaching_subjects: teaching_subjects !== undefined ? teaching_subjects : user.teaching_subjects,
      teaching_institute: teaching_institute !== undefined ? teaching_institute : user.teaching_institute,
      position: position !== undefined ? position : user.position,
      organization: organization !== undefined ? organization : user.organization,
      skills: parsedSkills,
      description: description !== undefined ? description : user.description,
      in_time: in_time || user.in_time,
      out_time: out_time || user.out_time,
      Salary_Cap: Salary_Cap ? Number.parseInt(Salary_Cap, 10) : user.Salary_Cap,
      reference_name: reference_name !== undefined ? reference_name : user.reference_name,
      has_disease: has_disease || user.has_disease,
      disease_description: disease_description !== undefined ? disease_description : user.disease_description,
      department: department || user.department,
    }

    // Handle sensitive data updates with encryption
    if (email) {
      // Check if new email already exists (excluding current user)
      const emailExists = await checkEmailExists(email)
      const currentEmail = decrypt(user.email)
      if (emailExists && email !== currentEmail) {
        return res.status(400).json({ message: "Email already exists" })
      }
      updateData.email = encrypt(email)
    }

    if (cnic) {
      // Check if new CNIC already exists (excluding current user)
      const cnicExists = await checkCnicExists(cnic)
      const currentCnic = decrypt(user.cnic)
      if (cnicExists && cnic !== currentCnic) {
        return res.status(400).json({ message: "CNIC already exists" })
      }
      updateData.cnic = encrypt(cnic)
    }

    if (contact_number) updateData.contact_number = encrypt(contact_number)
    if (guardian_phone) updateData.guardian_phone = encrypt(guardian_phone)
    if (permanent_address) updateData.permanent_address = encrypt(permanent_address)
    if (reference_contact) updateData.reference_contact = encrypt(reference_contact)
    if (teaching_contact) updateData.teaching_contact = encrypt(teaching_contact)

    console.log("💾 Updating user in database...")

    // Update user with new or existing data
    await user.update(updateData)

    console.log("✅ User updated successfully with encrypted data")
    res.status(200).json({ message: "User updated successfully", user: { id: user.id, employee_id: user.employee_id } })
  } catch (error) {
    console.error("❌ Update error:", error.stack)
    res.status(500).json({ message: "Update failed", error: error.message })
  }
}


// ✅ Update user role (Manager only)
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate role
    if (!["Employee", "Team Lead", "Manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    await user.update({ role });
    res.status(200).json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Change User Password (Self or Superadmin)
export const changeUserPassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, requesterRole, requesterId } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSuperAdmin = requesterRole === 'superadmin';
    const isSelf = Number(requesterId) === Number(id);

    // Verify permissions
    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({ message: "Unauthorized to change this password" });
    }

    // If NOT superadmin (i.e., it is self), verify old password
    if (!isSuperAdmin) {
      if (!oldPassword) return res.status(400).json({ message: "Current password is required" });

      let currentStoredPassword;
      if (user.password) {
        currentStoredPassword = decrypt(user.password);
      } else {
        currentStoredPassword = null;
      }

      if (currentStoredPassword !== oldPassword) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    // Update password
    const encryptedNewPassword = encrypt(newPassword);
    await user.update({ password: encryptedNewPassword });

    res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete user by ID and move to ex-employees (preserve encryption)
export const deleteUser = async (req, res) => {
  try {
    console.log(`🗑️ Deleting user with ID: ${req.params.id}`)

    // Find user by ID
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })

    // Move user data to ex-employees table with current date/time as exit_date
    await ExEmployee.create({
      ...user.toJSON(), // Copy all user data (encrypted data remains encrypted)
      exit_date: new Date(), // Add current date and time as exit_date
    })

    // Delete user from the users table
    await user.destroy()

    console.log("✅ User deleted and moved to ex-employees successfully")
    res.status(200).json({ message: "User deleted and moved to ex-employees successfully" })
  } catch (error) {
    console.error("❌ Delete error:", error.stack)
    res.status(500).json({ message: "Error deleting user", error: error.message })
  }
}

// ✅ Health check endpoint to verify encryption is working
export const healthCheck = async (req, res) => {
  try {
    const testData = "test@example.com"
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    const hashed = hashData(testData)

    res.status(200).json({
      message: "Encryption system is working",
      test: {
        original: testData,
        encrypted: encrypted ? "✅ Success" : "❌ Failed",
        decrypted: decrypted === testData ? "✅ Success" : "❌ Failed",
        hashed: hashed ? "✅ Success" : "❌ Failed",
      },
      encryption_key_status: ENCRYPTION_KEY ? "✅ Configured" : "❌ Missing",
    })
  } catch (error) {
    res.status(500).json({ message: "Encryption system error", error: error.message })
  }
}
