import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../Store/authStore";
import { useNavigate } from "react-router-dom";
import { authSchema } from "../Scheema/authScheema";
import { User, Mail, Lock, IdCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/TMS-LOGO.webp";

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

const AuthPage = () => {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      stakeholder: "superadmin",
      email: "",
      cnic: "",
      password: "admin123",
    },
  });

  const stakeholder = watch("stakeholder");

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  const onSubmit = async (data) => {
    const credentials =
      data.stakeholder === "employee"
        ? { email: data.email, password: data.password }
        : data.stakeholder === "hr"
          ? { email: data.email, password: data.password }
          : { password: data.password };

    const success = await login(data.stakeholder, credentials);
    if (success) {
      showPopup(`Logged in as ${data.stakeholder} successfully`);
      if (data.stakeholder === "employee") {
        navigate("/users");
      } else if (data.stakeholder === "hr") {
        navigate("/uploadfile");
      } else if (data.stakeholder === "superadmin") {
        navigate("/users");
      }
    } else {
      showPopup(error || "Login failed", "error");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.1 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-[90%] sm:max-w-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Techmire Solutions Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-xl font-semibold text-gray-800">Techmire Solutions</h1>
          <p className="text-xs text-gray-500">TMS Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={inputVariants}>
            <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
              <User size={16} className="text-orange-500" /> Role
            </label>
            <select
              {...register("stakeholder")}
              className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="superadmin">Super Admin</option>
            </select>
            {errors.stakeholder && (
              <p className="text-red-500 text-xs mt-1">{errors.stakeholder.message}</p>
            )}
          </motion.div>

          {stakeholder === "employee" ? (
            <>
              <motion.div variants={inputVariants}>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail size={16} className="text-orange-500" /> Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Your Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </motion.div>
              <motion.div variants={inputVariants}>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Lock size={16} className="text-orange-500" /> Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Your Password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </motion.div>
            </>
          ) : stakeholder === "hr" ? (
            <>
              <motion.div variants={inputVariants}>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail size={16} className="text-orange-500" /> HR Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </motion.div>
              <motion.div variants={inputVariants}>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Lock size={16} className="text-orange-500" /> Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </motion.div>
            </>
          ) : (
            <motion.div variants={inputVariants}>
              <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                <Lock size={16} className="text-orange-500" /> Password
              </label>
              <input
                type="password"
                {...register("password")}
                className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="Super Admin Password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:bg-orange-300 flex items-center justify-center gap-2"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging in
              </>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>
      </motion.div>

      <PopupMessage
        message={popupMessage?.text}
        type={popupMessage?.type}
        onClose={() => setPopupMessage(null)}
      />
    </div>
  );
};

export default AuthPage;