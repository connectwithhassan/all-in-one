import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useFileStore } from "../Store/useFileStore";
import { useAuthStore } from "../Store/authStore";
import UserList from "./UserList";
import axios from "axios";

export let exportedId = null;

const ViewDataPage = () => {
  const { fileData, fetchFiles, fetchFileData, deleteFile } = useFileStore();
  const { role, user } = useAuthStore(); // Get role and user from authStore
  const [machineLogs, setMachineLogs] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [viewMode, setViewMode] = useState("file"); // 'file', 'daily', 'logs'
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const tableContainerRef = useRef(null);
  const rowRefs = useRef([]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileClick = async (file) => {
    setSelectedFile(file.filename);
    setLoading(true);
    setSelectedFileId(file.id);
    const content = await fetchFileData(file.id);
    setLoading(false);

    if (!content) {
      setError("Failed to load file content.");
      return;
    }
    const parsedData = parseCSV(content);

    // Filter data based on role
    if (role === "employee" && user?.employee_id) {
      const filteredData = filterEmployeeData(parsedData, user.employee_id);
      setTableData(filteredData);
    } else {
      setTableData(parsedData);
    }

    setError("");
    setExpandedSections({});
  };

  const parseCSV = (csvText) => {
    const rows = csvText.split("\n").filter((row) => row.trim() !== "");
    const data = rows.map((row) => row.split(","));
    if (data.length <= 7) return [];
    return data.slice(7);
  };

  // Function to filter data for specific employee
  const filterEmployeeData = (data, employeeId) => {
    const userIndex = data.findIndex(
      (row) => row[0].trim() === "User ID" && row[1].trim() === employeeId
    );

    if (userIndex === -1) return [];

    const nextUserIdIndex = data
      .slice(userIndex + 1)
      .findIndex((row) => row[0].trim() === "User ID");
    const endIndex = nextUserIdIndex === -1 ? data.length : userIndex + nextUserIdIndex + 1;

    return data.slice(userIndex, endIndex);
  };

  const toggleExpand = (startIndex) => {
    setExpandedSections((prev) => {
      const newSections = { ...prev };
      if (newSections[startIndex]) {
        delete newSections[startIndex];
      } else {
        newSections[startIndex] = true;
      }
      return newSections;
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const foundIndex = tableData.findIndex((row) =>
      row.some((cell) => cell.trim().toLowerCase() === searchQuery.trim().toLowerCase())
    );

    if (foundIndex !== -1) {
      rowRefs.current[foundIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedRow(foundIndex);
      setTimeout(() => setHighlightedRow(null), 3000);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/attendance/sync");
      alert(`Sync Complete! Processed: ${response.data.processed} records.`);
    } catch (error) {
      console.error("Sync failed", error);
      alert("Sync failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/attendance");
      setMachineLogs(response.data);
      processDailySummary(response.data);
    } catch (error) {
      console.error("Fetch logs failed", error);
    } finally {
      setLoading(false);
    }
  };

  const processDailySummary = (logs) => {
    const summaryMap = {};

    logs.forEach(log => {
      const dateObj = new Date(log.timestamp);
      // Filter by Month/Year
      if (dateObj.getMonth() + 1 !== filterMonth || dateObj.getFullYear() !== filterYear) {
        return;
      }

      const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const userId = log.User ? log.User.id : `machine_${log.machine_user_id}`;
      const key = `${userId}_${dateStr}`;

      if (!summaryMap[key]) {
        summaryMap[key] = {
          userId: userId,
          name: log.User ? log.User.full_name : "Unknown",
          employeeId: log.User ? log.User.employee_id : "N/A",
          machineUserId: log.machine_user_id,
          date: dateStr,
          day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
          punches: []
        };
      }
      summaryMap[key].punches.push(dateObj);
    });

    const summaryArray = Object.values(summaryMap).map(item => {
      item.punches.sort((a, b) => a - b);
      const times = item.punches;

      const checkIn = times[0].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const checkOut = times.length > 1 ? times[times.length - 1].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "";

      const allPunches = times.map(t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })).join(", ");

      let status = "Present";
      if (times.length === 1) status = "Missing Out-Punch";

      return {
        ...item,
        checkIn,
        checkOut,
        allPunches,
        status
      };
    });

    // Sort by Name then Date
    summaryArray.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return new Date(a.date) - new Date(b.date);
    });

    setDailySummary(summaryArray);
  };

  useEffect(() => {
    if (viewMode === "daily" || viewMode === "logs") {
      fetchMachineLogs();
    }
  }, [viewMode]);

  useEffect(() => {
    if (machineLogs.length > 0) {
      processDailySummary(machineLogs);
    }
  }, [filterMonth, filterYear]);

  return (
    <div className="p-4 min-h-[58vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Records</h2>

        {/* View Switcher Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("file")}
            className={`px-3 py-1.5 rounded-md transition-all text-sm ${viewMode === "file" ? "bg-white text-blue-600 shadow font-medium" : "text-gray-600 hover:text-gray-900"
              }`}
          >
            File Uploads
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1.5 rounded-md transition-all text-sm ${viewMode === "daily" ? "bg-white text-blue-600 shadow font-medium" : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setViewMode("logs")}
            className={`px-3 py-1.5 rounded-md transition-all text-sm ${viewMode === "logs" ? "bg-white text-blue-600 shadow font-medium" : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Raw Logs
          </button>
        </div>

        <div className="flex gap-2">
          {(viewMode === 'daily' || viewMode === 'logs') && (
            <div className="flex gap-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="border rounded p-1 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="border rounded p-1 text-sm"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}

          {role === 'superadmin' && (viewMode === 'daily' || viewMode === 'logs') && (
            <button
              onClick={handleSync}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 disabled:bg-gray-400 flex items-center text-sm"
            >
              {loading ? "Syncing..." : "Sync Machine"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* ==================== FILE VIEW ==================== */}
      {viewMode === "file" && (
        <>
          {/* File List */}
          <div className="w-full mb-4">
            <h3 className="text-lg font-semibold mb-2">My Uploaded Files</h3>
            <ul className="border p-2 rounded-md shadow-md bg-white max-h-40 overflow-y-auto">
              {fileData.length === 0 ? (
                <p className="text-gray-600 p-2">No files found</p>
              ) : (
                fileData.map((file) => (
                  <li
                    key={file.id}
                    className={`cursor-pointer p-2 hover:bg-gray-100 border-b flex justify-between items-center ${selectedFileId === file.id ? "bg-blue-50" : ""
                      }`}
                  >
                    <span onClick={() => handleFileClick(file)} className="flex-grow">
                      📄 {file.filename}
                    </span>
                    {role === "hr" && (
                      <button
                        className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Wrapper for Search and Table */}
          {selectedFile && (
            <>
              {/* Search Bar */}
              {role !== "employee" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center gap-2"
                >
                  <input
                    type="text"
                    className="border p-2 rounded-md shadow-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Search User ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </motion.div>
              )}

              {/* File Data Table */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <div
                  ref={tableContainerRef}
                  className="overflow-auto border rounded-md shadow-lg bg-white max-h-[600px]"
                >
                  {loading ? (
                    <div className="animate-pulse p-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 rounded mb-2"></div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <tbody>
                        {tableData.map((row, rowIndex) => {
                          const isUserIdRow = row.some((cell) => cell.includes("User ID"));

                          if (isUserIdRow) {
                            return (
                              <motion.tr
                                key={rowIndex}
                                ref={(el) => (rowRefs.current[rowIndex] = el)}
                                className={`border-b bg-yellow-200 font-bold cursor-pointer hover:bg-yellow-300 ${highlightedRow === rowIndex ? "bg-yellow-400" : ""
                                  }`}
                                onClick={() => toggleExpand(rowIndex)}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="border text-sm p-1">
                                    {cell}
                                  </td>
                                ))}
                              </motion.tr>
                            );
                          }

                          const shouldShow = Object.keys(expandedSections).some((startIndex) => {
                            const start = parseInt(startIndex);
                            const nextUserIdIndex = tableData.slice(start + 1).findIndex((r) =>
                              r.some((cell) => cell.includes("User ID"))
                            );
                            const end = nextUserIdIndex === -1 ? tableData.length : start + nextUserIdIndex + 1;
                            return rowIndex > start && rowIndex < end;
                          });

                          if (shouldShow) {
                            return (
                              <tr
                                key={rowIndex}
                                className={`border-b hover:bg-gray-100 ${highlightedRow === rowIndex ? "bg-gray-300" : ""
                                  }`}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="border text-sm p-1">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </>
      )}

      {/* ==================== DAILY REPORT VIEW ==================== */}
      {viewMode === "daily" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check-In</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check-Out</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">All Punches</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailySummary.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No records found for this month/year.
                    </td>
                  </tr>
                ) : (
                  dailySummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.employeeId} (ID: {item.machineUserId})</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.day}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">{item.checkIn}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">{item.checkOut}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={item.allPunches}>
                        {item.allPunches}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ==================== RAW LOGS VIEW ==================== */}
      {viewMode === "logs" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status (Type)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {machineLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No logs found. Click "Sync Machine" to fetch data.
                    </td>
                  </tr>
                ) : (
                  machineLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {log.User ? log.User.full_name : "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-500 ml-2">
                            ({log.User ? log.User.employee_id : "Unmapped"})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.machine_user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.status === "0" ? "Check-In" : log.status === "1" ? "Check-Out" : log.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div style={{ display: "none" }}>
        <UserList exportedId={selectedFileId} />
      </div>
    </div>
  );
};

export default ViewDataPage;