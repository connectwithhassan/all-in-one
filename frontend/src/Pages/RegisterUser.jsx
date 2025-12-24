import React, { useState, useEffect } from "react";
import { useUserStore } from "../Store/userStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema } from "../Scheema/userScheema";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, IdCard, Loader2, Heart, Briefcase, GraduationCap, School, Clock, DollarSign, Phone, Users } from "lucide-react";

// Popup Message Component
const PopupMessage = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${type === "success" ? "bg-green-100 text-green-700" : "bg-red-500 text-white"
          }`}
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// HR Management Modal
const HrManagementModal = ({ isOpen, onClose, onSubmit, hrList, onDelete }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { hrEmail: "", hrPassword: "" },
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                <Users size={20} className="text-orange-500" /> Manage HR
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <Lock size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail size={16} className="text-orange-500" /> HR Email
                </label>
                <input
                  type="email"
                  {...register("hrEmail", { required: "Email is required" })}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Email"
                />
                {errors.hrEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.hrEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Lock size={16} className="text-orange-500" /> HR Password
                </label>
                <input
                  type="password"
                  {...register("hrPassword", { required: "Password is required" })}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Password"
                />
                {errors.hrPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.hrPassword.message}</p>
                )}
              </div>
              <motion.button
                type="submit"
                className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create HR
              </motion.button>
            </form>

            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700">Current HR</h4>
              {hrList.length === 0 ? (
                <p className="text-gray-500 text-sm mt-1">No HR created yet.</p>
              ) : (
                <ul className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {hrList.map((hr, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span>{hr.email}</span>
                      <button
                        onClick={() => onDelete(hr.email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Role Selection Modal
const RoleSelectionModal = ({ isOpen, onSelectRole, onClose, onPasswordSubmit, passwordError }) => {
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleRoleSelect = (role) => {
    if (role === "hr") {
      setShowPasswordInput(true);
    } else {
      onSelectRole(role);
    }
  };

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                <Users size={20} className="text-orange-500" /> Select Action
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <Lock size={20} />
              </button>
            </div>

            {!showPasswordInput ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Do you want to register an employee or create an HR?</p>
                <motion.button
                  onClick={() => handleRoleSelect("employee")}
                  className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Register Employee
                </motion.button>
                <motion.button
                  onClick={() => handleRoleSelect("hr")}
                  className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create HR
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Lock size={16} className="text-orange-500" /> Super Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    placeholder="Enter Super Admin Password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setShowPasswordInput(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handlePasswordSubmit}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RegisterUser = () => {
  const { registerUser, loading, error } = useUserStore();
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [popupMessage, setPopupMessage] = useState(null);
  const [role, setRole] = useState(null);
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] = useState(true);
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [hrList, setHrList] = useState([]);
  const [passwordError, setPasswordError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerUserSchema),
    mode: "onChange",
  });

  const formValues = watch();

  const requiredFields = [
    "employee_id",
    "registration_date",
    "joining_date",
    "post_applied_for",
    "full_name",
    "gender",
    "cnic",
    "dob",
    "permanent_address",
    "contact_number",
    "email",
    "degree",
    "institute",
    "grade",
    "year",
    "in_time",
    "out_time",
    "Salary_Cap",
    "guardian_phone",
  ];

  useEffect(() => {
    if (isHrModalOpen) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`)
        .then((response) => response.json())
        .then((data) => setHrList(data.hrList))
        .catch((error) => {
          console.error("Error fetching HR list:", error);
          showPopup("Error fetching HR list", "error");
        });
    }
  }, [isHrModalOpen]);

  useEffect(() => {
    const totalRequiredFields = requiredFields.length;
    const filledRequiredFields = requiredFields.filter(
      (field) => formValues[field] !== undefined && formValues[field] !== ""
    ).length;
    const optionalFields = Object.keys(formValues).filter(
      (key) => !requiredFields.includes(key)
    );
    const filledOptionalFields = optionalFields.filter(
      (field) => formValues[field] !== undefined && formValues[field] !== ""
    ).length;
    const totalFields = requiredFields.length + optionalFields.length;
    const baseProgress = (filledRequiredFields / totalRequiredFields) * 100;
    const optionalBonus =
      optionalFields.length > 0 ? (filledOptionalFields / totalFields) * 10 : 0;
    setProgress(Math.min(baseProgress + optionalBonus, 100));
  }, [formValues]);

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  const onSubmit = async (data) => {
    if (!isValid) {
      console.error("❌ Validation failed:", errors);
      showPopup("Validation failed. Please check your inputs.", "error");
      return;
    }

    try {
      const result = await registerUser(data);
      if (result) {
        showPopup("User added successfully!");
        reset();
        setImagePreview(null);
        setStep(1);
        setProgress(0);
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      showPopup(error.message || "Failed to register user", "error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      const step1Required = [
        "full_name",
        "email",
        "gender",
        "cnic",
        "dob",
        "contact_number",
        "permanent_address",
        "guardian_phone",
      ];
      const hasErrors = step1Required.some((field) => errors[field]);
      if (!hasErrors) setStep(2);
    } else if (step === 2) {
      const step2Required = ["degree", "institute", "grade", "year"];
      const hasErrors = step2Required.some((field) => errors[field]);
      if (!hasErrors) setStep(3);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setIsRoleSelectionModalOpen(false);
  };

  const handlePasswordSubmit = (password) => {
    if (password === "tmsportal123") {
      setRole("hr");
      setIsRoleSelectionModalOpen(false);
      setIsHrModalOpen(true);
      setPasswordError(null);
    } else {
      setPasswordError("Invalid Super Admin Password");
      showPopup("Invalid Super Admin Password", "error");
    }
  };

  const handleHrSubmit = async (data) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/create-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.hrEmail, password: data.hrPassword }),
      });
      if (response.ok) {
        showPopup("HR created successfully");
        const updatedList = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`).then((res) => res.json());
        setHrList(updatedList.hrList);
      } else {
        showPopup("Failed to create HR", "error");
      }
    } catch (error) {
      console.error("Error creating HR:", error);
      showPopup("Error creating HR", "error");
    }
  };

  const handleHrDelete = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/delete-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        showPopup("HR deleted successfully");
        const updatedList = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`).then((res) => res.json());
        setHrList(updatedList.hrList);
      } else {
        showPopup("Failed to delete HR", "error");
      }
    } catch (error) {
      console.error("Error deleting HR:", error);
      showPopup("Error deleting HR", "error");
    }
  };

  const hasDisease = watch("has_disease") === "Yes";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      {role === "employee" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto max-w-2xl"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
            <User size={24} className="mr-2 text-orange-500" /> Register Employee
          </h2>

          {error && !popupMessage && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <motion.div
              className="bg-orange-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 bg-white p-4 sm:p-6 rounded-lg shadow-md"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <User size={20} className="text-orange-500" /> Personal Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Full Name
                      </label>
                      <input
                        type="text"
                        {...register("full_name")}
                        placeholder="Enter Full Name"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Mail size={16} className="text-orange-500" /> Email Address
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        placeholder="Enter Email"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Gender
                      </label>
                      <select
                        {...register("gender")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Gender
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {errors.gender && (
                        <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <IdCard size={16} className="text-orange-500" /> CNIC Number
                      </label>
                      <input
                        type="text"
                        {...register("cnic")}
                        placeholder="Enter CNIC (13 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.cnic && (
                        <p className="text-red-500 text-xs mt-1">{errors.cnic.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Date of Birth
                      </label>
                      <input
                        type="date"
                        {...register("dob")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.dob && (
                        <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Contact Number
                      </label>
                      <input
                        type="text"
                        {...register("contact_number")}
                        placeholder="Enter Contact Number (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.contact_number && (
                        <p className="text-red-500 text-xs mt-1">{errors.contact_number.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Permanent Address
                      </label>
                      <input
                        type="text"
                        {...register("permanent_address")}
                        placeholder="Enter Permanent Address"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.permanent_address && (
                        <p className="text-red-500 text-xs mt-1">{errors.permanent_address.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Guardian/Alternate Phone
                      </label>
                      <input
                        type="text"
                        {...register("guardian_phone")}
                        placeholder="Enter Guardian Phone (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.guardian_phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.guardian_phone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Reference Person (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("reference_name")}
                        placeholder="Enter Reference Name"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.reference_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.reference_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Reference Contact (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("reference_contact")}
                        placeholder="Enter Reference Contact (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.reference_contact && (
                        <p className="text-red-500 text-xs mt-1">{errors.reference_contact.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Profile Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full p-2 mt-1 border rounded-md text-sm"
                      />
                      {imagePreview && (
                        <motion.img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-4 w-32 h-32 object-cover rounded-md border border-gray-300"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      {errors.image && (
                        <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>
                      )}
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={Object.keys(errors).some((field) =>
                      ["full_name", "email", "gender", "cnic", "dob", "contact_number", "permanent_address", "guardian_phone"].includes(field)
                    )}
                  >
                    Next Step
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <GraduationCap size={20} className="text-orange-500" /> Last Education
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <GraduationCap size={16} className="text-orange-500" /> Degree
                      </label>
                      <input
                        type="text"
                        {...register("degree")}
                        placeholder="Enter Degree"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.degree && (
                        <p className="text-red-500 text-xs mt-1">{errors.degree.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <School size={16} className="text-orange-500" /> Institute
                      </label>
                      <input
                        type="text"
                        {...register("institute")}
                        placeholder="Enter Institute"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.institute && (
                        <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Grade
                      </label>
                      <input
                        type="text"
                        {...register("grade")}
                        placeholder="Enter Grade"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.grade && (
                        <p className="text-red-500 text-xs mt-1">{errors.grade.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Year
                      </label>
                      <input
                        type="number"
                        {...register("year")}
                        placeholder="Enter Year"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <Briefcase size={20} className="text-orange-500" /> Past Teaching Experience (Optional)
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Teaching Subjects
                      </label>
                      <input
                        type="text"
                        {...register("teaching_subjects")}
                        placeholder="Enter Subjects"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_subjects && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_subjects.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <School size={16} className="text-orange-500" /> Teaching Institute
                      </label>
                      <input
                        type="text"
                        {...register("teaching_institute")}
                        placeholder="Enter Institute"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_institute && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_institute.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Teaching Contact
                      </label>
                      <input
                        type="text"
                        {...register("teaching_contact")}
                        placeholder="Enter Contact (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_contact && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_contact.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <Briefcase size={20} className="text-orange-500" /> Other Experience (Optional)
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Position
                      </label>
                      <input
                        type="text"
                        {...register("position")}
                        placeholder="Enter Position"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.position && (
                        <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Organization
                      </label>
                      <input
                        type="text"
                        {...register("organization")}
                        placeholder="Enter Organization"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.organization && (
                        <p className="text-red-500 text-xs mt-1">{errors.organization.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Skills
                      </label>
                      <input
                        type="text"
                        {...register("skills")}
                        placeholder="Enter Skills (e.g., Java, Python)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                        onChange={(e) => setValue("skills", e.target.value)}
                      />
                      {errors.skills && (
                        <p className="text-red-500 text-xs mt-1">{errors.skills.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium hover:bg-gray-500 flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={Object.keys(errors).some((field) =>
                        ["degree", "institute", "grade", "year"].includes(field)
                      )}
                    >
                      Next Step
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <School size={20} className="text-orange-500" /> Office Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Employee ID
                      </label>
                      <input
                        type="text"
                        {...register("employee_id")}
                        placeholder="Enter Employee ID"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.employee_id && (
                        <p className="text-red-500 text-xs mt-1">{errors.employee_id.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Registration Date
                      </label>
                      <input
                        type="date"
                        {...register("registration_date")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.registration_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.registration_date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Joining Date
                      </label>
                      <input
                        type="date"
                        {...register("joining_date")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.joining_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.joining_date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Briefcase size={16} className="text-orange-500" /> Post Applied For
                      </label>
                      <select
                        {...register("post_applied_for")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Post
                        </option>
                        <option value="Employee">Employee</option>
                        <option value="Internship">Internship</option>
                      </select>
                      {errors.post_applied_for && (
                        <p className="text-red-500 text-xs mt-1">{errors.post_applied_for.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Briefcase size={16} className="text-orange-500" /> Department/Sector
                      </label>
                      <select
                        {...register("department")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Department
                        </option>
                        <option value="Development">Development</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Designing">Designing</option>
                        <option value="Animations">Animations</option>
                      </select>
                      {errors.department && (
                        <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={16} className="text-orange-500" /> Check-In Time
                      </label>
                      <input
                        type="time"
                        {...register("in_time")}
                        placeholder="Enter In Time (e.g., 09:00)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.in_time && (
                        <p className="text-red-500 text-xs mt-1">{errors.in_time.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={16} className="text-orange-500" /> Check-Out Time
                      </label>
                      <input
                        type="time"
                        {...register("out_time")}
                        placeholder="Enter Out Time (e.g., 16:00)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.out_time && (
                        <p className="text-red-500 text-xs mt-1">{errors.out_time.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <DollarSign size={16} className="text-orange-500" /> Salary Cap
                      </label>
                      <input
                        type="number"
                        {...register("Salary_Cap")}
                        placeholder="Enter Salary Cap (e.g., 50000)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.Salary_Cap && (
                        <p className="text-red-500 text-xs mt-1">{errors.Salary_Cap.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Description (Optional)
                      </label>
                      <textarea
                        {...register("description")}
                        placeholder="Enter Description"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <Heart size={20} className="text-orange-500" /> Health Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Heart size={16} className="text-orange-500" /> Any Disease?
                      </label>
                      <select
                        {...register("has_disease")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Option
                        </option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                      {errors.has_disease && (
                        <p className="text-red-500 text-xs mt-1">{errors.has_disease.message}</p>
                      )}
                    </div>
                    {hasDisease && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Heart size={16} className="text-orange-500" /> Disease Description
                        </label>
                        <textarea
                          {...register("disease_description")}
                          placeholder="Describe the disease"
                          className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                        />
                        {errors.disease_description && (
                          <p className="text-red-500 text-xs mt-1">{errors.disease_description.message}</p>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium hover:bg-gray-500 flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Register
                          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </motion.div>
      )}

      <RoleSelectionModal
        isOpen={isRoleSelectionModalOpen}
        onSelectRole={handleRoleSelect}
        onClose={() => setIsRoleSelectionModalOpen(false)}
        onPasswordSubmit={handlePasswordSubmit}
        passwordError={passwordError}
      />

      <HrManagementModal
        isOpen={isHrModalOpen}
        onClose={() => setIsHrModalOpen(false)}
        onSubmit={handleHrSubmit}
        hrList={hrList}
        onDelete={handleHrDelete}
      />

      <PopupMessage
        message={popupMessage?.text}
        type={popupMessage?.type}
        onClose={() => setPopupMessage(null)}
      />
    </div>
  );
};

export default RegisterUser;
