import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/TMS-LOGO.webp";
import { useAuthStore } from "../Store/authStore";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define navigation links based on role
  const getNavLinks = () => {
    const userRole = role?.toLowerCase();

    if (["employee", "team lead", "manager"].includes(userRole)) {
      return [
        { path: "/view", label: "Attendance" },
        { path: "/profile", label: "Profile" },
        { path: "/tasks", label: "Tasks" },
      ];
    } else if (userRole === "hr") {
      return [
        { path: "/uploadfile", label: "Upload" },
        { path: "/view", label: "Attendance" },
        { path: "/register", label: "Registration" },
        { path: "/users", label: "Staff" },
        { path: "/registerusers", label: "Payrolls" },
      ];
    } else if (userRole === "superadmin") {
      return [
        { path: "/uploadfile", label: "Upload" },
        { path: "/view", label: "Attendance" },
        { path: "/register", label: "Registration" },
        { path: "/users", label: "Staff" },
        { path: "/registerusers", label: "Payrolls" },
        { path: "/ex-employees", label: "Ex-Employees" },
        { path: "/tasks", label: "Tasks" },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-black text-white p-4 shadow-md bg-opacity-95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <img src={logo} alt="Techmire Solution Logo" className="h-8 md:h-10 mr-2 md:mr-3" />
          <h1 className="text-lg md:text-2xl font-bold truncate">Techmire Solution</h1>
        </motion.div>

        {/* Desktop Navigation */}
        {user ? (
          <>
            <div className="hidden md:flex items-center space-x-2">
              {/* Navigation Links */}
              {navLinks.length > 0 &&
                navLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg transition text-sm lg:text-base ${isActive
                          ? "bg-[oklch(0.67_0.19_42.13)]"
                          : "bg-gray-800 hover:bg-gray-700"
                        } text-white`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-sm lg:text-base ml-2"
              >
                Logout
              </motion.button>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </>
        ) : (
          <span className="hidden md:block text-sm">Please log in to see navigation options</span>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-gray-900 rounded-b-lg mt-2"
          >
            <div className="flex flex-col p-4 space-y-2">
              {navLinks.map((link, index) => (
                <NavLink
                  key={index}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg transition block text-center ${isActive
                      ? "bg-[oklch(0.67_0.19_42.13)] font-semibold"
                      : "bg-gray-800 hover:bg-gray-700"
                    } text-white`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition w-full text-center font-semibold mt-2"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;