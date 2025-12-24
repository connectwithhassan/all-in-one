import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { X, Calendar, User, AlignLeft, AlertCircle } from "lucide-react";
import { useTaskStore } from "../Store/taskStore";
import { useUserStore } from "../Store/userStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TaskModal = ({ isOpen, onClose, task, currentUser }) => {
    const { createTask, updateTask, deleteTask } = useTaskStore();
    const { users, fetchUsers } = useUserStore();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: task?.title || "",
            description: task?.description || "",
            priority: task?.priority || "Medium",
            assigned_to: task?.assigned_to || "",
            status: task?.status || "Pending",
            deadline: task?.deadline ? new Date(task.deadline) : new Date()
        }
    });

    const deadline = watch("deadline");

    useEffect(() => {
        if (users.length === 0) fetchUsers();
    }, [fetchUsers, users.length]);

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            assigned_by_id: currentUser.id,
            role: currentUser.role // To pass role check to backend?
        };

        if (task) {
            await updateTask(task.id, { ...payload, role: currentUser.role });
        } else {
            await createTask(payload);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm("Delete this task?")) {
            await deleteTask(task.id, currentUser.role);
            onClose();
        }
    };

    // Permission Logic
    const isManager = currentUser.role === "Manager";
    const isTeamLead = currentUser.role === "Team Lead";
    const isCreator = task?.assigned_by === currentUser.id;

    // Edit Permissions
    // Manager: Can edit everything
    // Team Lead: Cannot edit deadline
    // Employee: Can only edit Status (handled by restricted inputs)
    const canEditDetails = isManager || (isTeamLead && !task); // TL can edit when creating? Yes. When editing existing? No deadline.

    // Filter Users Logic
    let filteredUsers = users;
    if (isTeamLead) {
        // Team Lead: Own sector employees only
        filteredUsers = users.filter(u =>
            u.role === "Employee" &&
            u.department === currentUser.department
        );
    } else if (isManager || currentUser.role === "superadmin") {
        // Manager/Superadmin: All Employees and Team Leads
        filteredUsers = users.filter(u =>
            ["Employee", "Team Lead"].includes(u.role)
        );
    }
    // Employees cannot minimize assignment dropdown usually, but if they could, they shouldn't see anyone (or maybe valid for self-assign if allowed).
    // Assuming Employee cannot assign. Logic in backend also blocks creatorUser.role === 'Employee'.

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {task ? "Edit Task" : "Create New Task"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            {...register("title", { required: "Title is required" })}
                            disabled={!canEditDetails && task}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            placeholder="Task title"
                        />
                        {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            {...register("description")}
                            disabled={!canEditDetails && task}
                            rows={3}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            placeholder="Task description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                {...register("priority")}
                                disabled={!canEditDetails && task}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        {/* Status - Everyone can edit status if assigned to them */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                {...register("status")}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee & Deadline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                            <select
                                {...register("assigned_to", { required: "Assignee is required" })}
                                disabled={!canEditDetails && task}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            >
                                <option value="">Select Employee</option>
                                {filteredUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name} ({user.role}) {user.department ? `- ${user.department}` : ""}
                                    </option>
                                ))}
                            </select>
                            {errors.assigned_to && <span className="text-red-500 text-xs">{errors.assigned_to.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                            <DatePicker
                                selected={deadline}
                                onChange={(date) => setValue("deadline", date)}
                                disabled={isTeamLead && task} // Team Lead cannot edit deadline
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                                dateFormat="MMM d, yyyy"
                            />
                            {isTeamLead && task && <p className="text-[10px] text-red-500 mt-1">Cannot change deadline</p>}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        {isManager && task && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium mr-auto"
                            >
                                Delete Task
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                        >
                            {task ? "Update Task" : "Create Task"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default TaskModal;
