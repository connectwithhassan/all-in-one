import { create } from "zustand";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/'}tasks`;

// Helper to get token (if you use auth token in future)
// const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export const useTaskStore = create((set) => ({
    tasks: [],
    loading: false,
    error: null,

    fetchTasks: async (userId, role) => {
        set({ loading: true });
        try {
            const response = await axios.get(`${API_URL}/all`, {
                params: { user_id: userId, role }
            });
            set({ tasks: response.data.tasks, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createTask: async (taskData) => {
        set({ loading: true });
        try {
            const response = await axios.post(`${API_URL}/create`, taskData);
            set(state => ({
                tasks: [response.data.task, ...state.tasks],
                loading: false
            }));
            return response.data.task;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateTask: async (id, updates) => {
        // Optimistic update
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));

        try {
            await axios.put(`${API_URL}/update/${id}`, updates);
        } catch (error) {
            // Revert? For now just log
            // fetchTasks...
            console.error(error);
        }
    },

    deleteTask: async (id, role) => {
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
        try {
            await axios.delete(`${API_URL}/delete/${id}`, { data: { role } });
        } catch (error) {
            console.error(error);
        }
    }
}));
