import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import UploadPage from "./Pages/UploadPage";
import ViewDataPage from "./Pages/ViewDataPage";
import RegisterUser from "./Pages/RegisterUser";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import AllRegisteredUsers from "./Pages/Allusers";
import UserList from "./Pages/UserList";
import AuthPage from "./Pages/authPage";
import ProfilePage from "./Pages/ProfilePage";
import ExEmployeePage from "./Pages/ExEmployeePage";
import TaskBoard from "./Pages/TaskBoard";
import { useAuthStore } from "./Store/authStore";

// Layout component with Tailwind CSS for sticky footer
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isAuthPage = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && user && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAuthPage && user && <Footer />}
    </div>
  );
};

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuthStore();

  if (!user) {
    return <AuthPage />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <div>Access Denied: You do not have permission to view this page.</div>;
  }

  return children;
};

// App component
const App = () => {
  const { user, role } = useAuthStore();

  return (
    <Router>
      <Layout>
        <Routes>
          {!user && <Route path="/" element={<AuthPage />} />}
          {!user && <Route path="*" element={<AuthPage />} />}

          {user && (
            <>
              <Route path="/view" element={<ViewDataPage />} />

              {role?.toLowerCase() === "employee" && (
                <>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/" element={<AuthPage />} />
                  <Route path="*" element={<ProfilePage />} />
                </>
              )}

              {role?.toLowerCase() === "hr" && (
                <>
                  <Route
                    path="/uploadfile"
                    element={<ProtectedRoute allowedRoles={["hr"]}><UploadPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/register"
                    element={<ProtectedRoute allowedRoles={["hr"]}><RegisterUser /></ProtectedRoute>}
                  />
                  <Route
                    path="/users"
                    element={<ProtectedRoute allowedRoles={["hr"]}><AllRegisteredUsers /></ProtectedRoute>}
                  />
                  <Route
                    path="/registerusers"
                    element={<ProtectedRoute allowedRoles={["hr"]}><UserList /></ProtectedRoute>}
                  />
                  <Route path="/" element={<AuthPage />} />
                  <Route path="*" element={<AuthPage />} />
                </>
              )}

              {/* Task Management Route - Available to Managers, Team Leads, Employees AND Superadmin */}
              {["employee", "manager", "team lead", "superadmin"].includes(role?.toLowerCase()) && (
                <>
                  <Route path="/tasks" element={<TaskBoard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  {/* If user is purely an employee/manager/lead (not HR/Superadmin), default to tasks or profile */}
                  <Route path="/" element={<TaskBoard />} />
                </>
              )}

              {role?.toLowerCase() === "superadmin" && (
                <>
                  <Route path="/uploadfile" element={<UploadPage />} />
                  <Route path="/register" element={<RegisterUser />} />
                  <Route path="/users" element={<AllRegisteredUsers />} />
                  <Route path="/registerusers" element={<UserList />} />
                  <Route path="/ex-employees" element={<ExEmployeePage />} />
                  <Route path="/" element={<ProfilePage />} />
                  <Route path="*" element={<ProfilePage />} />
                </>
              )}
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;