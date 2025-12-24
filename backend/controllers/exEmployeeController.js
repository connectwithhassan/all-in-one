import ExEmployee from "../models/exEmployeeModel.js"
import crypto from "crypto"

// 🔐 Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = "aes-256-cbc"

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error("❌ ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  process.exit(1)
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex")

// ✅ Encryption/Decryption functions
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
    return text
  }
}

// ✅ Fetch all ex-employees with decrypted data
export const getExEmployees = async (req, res) => {
  try {
    console.log("🔍 Fetching all ex-employees...")
    const exEmployees = await ExEmployee.findAll()

    // Decrypt sensitive data and convert images
    const exEmployeesWithDecryptedData = exEmployees.map((exEmployee) => {
      const data = exEmployee.toJSON()

      // Decrypt sensitive fields
      const decryptedData = {
        ...data,
        employee_id: decrypt(data.employee_id) || data.employee_id,
        full_name: decrypt(data.full_name) || data.full_name,
        email: decrypt(data.email) || data.email,
        cnic: decrypt(data.cnic) || data.cnic,
        permanent_address: decrypt(data.permanent_address) || data.permanent_address,
        contact_number: decrypt(data.contact_number) || data.contact_number,
        guardian_phone: decrypt(data.guardian_phone) || data.guardian_phone,
        teaching_contact: data.teaching_contact ? decrypt(data.teaching_contact) : null,
        reference_contact: data.reference_contact ? decrypt(data.reference_contact) : null,
        Salary_Cap: Number.parseFloat(decrypt(data.Salary_Cap)) || 0,

        // Convert image to base64 if exists
        image: data.image ? `data:image/jpeg;base64,${data.image.toString("base64")}` : null,
      }

      // Mask CNIC for security in response
      if (decryptedData.cnic && decryptedData.cnic.length >= 4) {
        decryptedData.cnic_display = `****-****-${decryptedData.cnic.slice(-4)}`
        decryptedData.cnic = decryptedData.cnic_display
      }

      return decryptedData
    })

    console.log(`✅ Successfully fetched ${exEmployeesWithDecryptedData.length} ex-employee records`)
    res.status(200).json(exEmployeesWithDecryptedData)
  } catch (error) {
    console.error("❌ Fetch ex-employees error:", error.stack)
    res.status(500).json({ message: "Server Error", error: error.message })
  }
}

// ✅ Delete an ex-employee by ID
export const deleteExEmployee = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🗑️ Deleting ex-employee with ID: ${id}`)

    const exEmployee = await ExEmployee.findByPk(id)
    if (!exEmployee) {
      return res.status(404).json({ message: "Ex-employee not found" })
    }

    await exEmployee.destroy()

    console.log("✅ Ex-employee deleted successfully")
    res.status(200).json({ message: "Ex-employee deleted successfully" })
  } catch (error) {
    console.error("❌ Delete ex-employee error:", error.stack)
    res.status(500).json({ message: "Error deleting ex-employee", error: error.message })
  }
}

// ✅ Get ex-employee by ID with decrypted data
export const getExEmployeeById = async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🔍 Fetching ex-employee with ID: ${id}`)

    const exEmployee = await ExEmployee.findByPk(id)
    if (!exEmployee) {
      return res.status(404).json({ message: "Ex-employee not found" })
    }

    const data = exEmployee.toJSON()

    // Decrypt sensitive data
    const decryptedData = {
      ...data,
      employee_id: decrypt(data.employee_id) || data.employee_id,
      full_name: decrypt(data.full_name) || data.full_name,
      email: decrypt(data.email) || data.email,
      cnic: decrypt(data.cnic) || data.cnic,
      permanent_address: decrypt(data.permanent_address) || data.permanent_address,
      contact_number: decrypt(data.contact_number) || data.contact_number,
      guardian_phone: decrypt(data.guardian_phone) || data.guardian_phone,
      teaching_contact: data.teaching_contact ? decrypt(data.teaching_contact) : null,
      reference_contact: data.reference_contact ? decrypt(data.reference_contact) : null,
      Salary_Cap: Number.parseFloat(decrypt(data.Salary_Cap)) || 0,

      // Convert image to base64 if exists
      image: data.image ? `data:image/jpeg;base64,${data.image.toString("base64")}` : null,
    }

    // Mask CNIC for security
    if (decryptedData.cnic && decryptedData.cnic.length >= 4) {
      decryptedData.cnic_display = `****-****-${decryptedData.cnic.slice(-4)}`
      decryptedData.cnic = decryptedData.cnic_display
    }

    console.log("✅ Ex-employee data retrieved and decrypted successfully")
    res.status(200).json(decryptedData)
  } catch (error) {
    console.error("❌ Get ex-employee error:", error.stack)
    res.status(500).json({ message: "Error fetching ex-employee", error: error.message })
  }
}

// ✅ Search ex-employees by name or employee ID (with decryption)
export const searchExEmployees = async (req, res) => {
  try {
    const { query } = req.query
    console.log(`🔍 Searching ex-employees with query: ${query}`)

    if (!query) {
      return res.status(400).json({ message: "Search query is required" })
    }

    // Since data is encrypted, we need to fetch all and search through decrypted data
    const allExEmployees = await ExEmployee.findAll()

    const matchingExEmployees = allExEmployees.filter((exEmployee) => {
      const data = exEmployee.toJSON()
      const decryptedName = decrypt(data.full_name) || ""
      const decryptedEmployeeId = decrypt(data.employee_id) || ""

      return (
        decryptedName.toLowerCase().includes(query.toLowerCase()) ||
        decryptedEmployeeId.toLowerCase().includes(query.toLowerCase())
      )
    })

    // Decrypt data for response
    const decryptedResults = matchingExEmployees.map((exEmployee) => {
      const data = exEmployee.toJSON()
      return {
        ...data,
        employee_id: decrypt(data.employee_id) || data.employee_id,
        full_name: decrypt(data.full_name) || data.full_name,
        email: decrypt(data.email) || data.email,
        cnic: `****-****-${(decrypt(data.cnic) || "").slice(-4)}`, // Masked CNIC
        contact_number: decrypt(data.contact_number) || data.contact_number,
        image: data.image ? `data:image/jpeg;base64,${data.image.toString("base64")}` : null,
      }
    })

    console.log(`✅ Found ${decryptedResults.length} matching ex-employees`)
    res.status(200).json(decryptedResults)
  } catch (error) {
    console.error("❌ Search ex-employees error:", error.stack)
    res.status(500).json({ message: "Error searching ex-employees", error: error.message })
  }
}

// ✅ Health check for ex-employee encryption
export const exEmployeeHealthCheck = async (req, res) => {
  try {
    const testData = "test@example.com"
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)

    res.status(200).json({
      message: "Ex-employee encryption system is working",
      test: {
        original: testData,
        encrypted: encrypted ? "✅ Success" : "❌ Failed",
        decrypted: decrypted === testData ? "✅ Success" : "❌ Failed",
      },
      encryption_key_status: ENCRYPTION_KEY ? "✅ Configured" : "❌ Missing",
    })
  } catch (error) {
    res.status(500).json({ message: "Ex-employee encryption system error", error: error.message })
  }
}
