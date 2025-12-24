import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../Store/taskStore";
import { useUserStore } from "../Store/userStore";
import TaskModal from "../Components/TaskModal";
import { Plus, Filter, Calendar, User, AlignLeft, AlertCircle } from "lucide-react";
import { DndContext, closestCorners, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const TaskBoard = () => {
    // Stores
    const { tasks, fetchTasks, updateTask, loading, error } = useTaskStore();
    const { users } = useUserStore(); // To get list of users for assignment

    // Local State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState("all"); // all, my-tasks, assigned-by-me

    // Mock logged in user (Replace with actual auth store)
    const currentUser = JSON.parse(localStorage.getItem("user")) || { id: 1, role: "Manager", full_name: "Admin" };

    useEffect(() => {
        // Fetch tasks based on role (handled by store/backend usually, but here we fetch all and filter or fetch specific)
        fetchTasks(currentUser.id, currentUser.role);
    }, [fetchTasks, currentUser.id, currentUser.role]);

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id; // Dropped on a column ID (pending, in-progress, completed)

        // Find task
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            // Optimistic update locally? Store handles it
            await updateTask(taskId, { status: newStatus, role: currentUser.role });
        }
    };

    // Columns
    const columns = {
        Pending: tasks.filter(t => t.status === "Pending"),
        "In Progress": tasks.filter(t => t.status === "In Progress"),
        Completed: tasks.filter(t => t.status === "Completed")
    };

    return (
        <div className="container mx-auto p-6 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Task Board</h1>
                <div className="flex gap-4">
                    {/* Filter (Simple implementation) */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded shadow text-sm">
                        <Filter size={16} className="text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent outline-none"
                        >
                            <option value="all">All Tasks</option>
                            <option value="my-tasks">Assigned to Me</option>
                        </select>
                    </div>

                    {currentUser.role !== "Employee" && (
                        <button
                            onClick={handleCreateTask}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus size={20} /> New Task
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(columns).map(([status, columnTasks]) => (
                        <div key={status} className="bg-gray-100 p-4 rounded-xl min-h-[500px]">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700 flex justify-between">
                                {status}
                                <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                                    {columnTasks.length}
                                </span>
                            </h2>
                            <div className="space-y-3">
                                {columnTasks.map(task => (
                                    <motion.div
                                        key={task.id}
                                        layoutId={task.id}
                                        onClick={() => handleEditTask(task)}
                                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-gray-200"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider 
                                                ${task.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-green-100 text-green-600'}`}>
                                                {task.priority}
                                            </span>
                                            {task.deadline && (
                                                <span className={`text-xs flex items-center ${new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                    <Calendar size={12} className="mr-1" />
                                                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-800 mb-1">{task.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>

                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <User size={12} />
                                                {task.assignee?.full_name || "Unassigned"}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <TaskModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        task={selectedTask}
                        currentUser={currentUser}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskBoard;
