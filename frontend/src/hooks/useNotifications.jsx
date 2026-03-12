import { useEffect, useState } from "react";
import { io } from 'socket.io-client'
import axiosInstance from "../utils/axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:1111"

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    // Fetch old notifications
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`${BASE_URL}/me/notifications`)
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Connect socket
    const socket = io(BASE_URL, {
      withCredentials: true
    });

    socket.on('connect', () => {
      socket.emit('join_user_room', user._id);
    });

    socket.on('receive_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => socket.disconnect();
  }, [user]);

  // Updated to update UI instantly
  const markAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic UI Update
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await axiosInstance.patch(`${BASE_URL}/me/notifications/read`);
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  // NEW: Delete a single notification
  const deleteNotification = async (notificationId) => {
    // 1. Optimistic UI update: Find it and remove it from the screen immediately
    const notificationToDelete = notifications.find(n => n._id === notificationId);

    setNotifications(prev => prev.filter(n => n._id !== notificationId));

    // Adjust unread count instantly if the deleted one was unread
    if (notificationToDelete && !notificationToDelete.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      // 2. Tell the backend to delete it
      await axiosInstance.delete(`${BASE_URL}/me/notifications/${notificationId}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // NEW: Clear all notifications
  const clearAllNotifications = async () => {
    // 1. Optimistic UI update: Wipe the screen immediately
    setNotifications([]);
    setUnreadCount(0);

    try {
      // 2. Tell backend to wipe them from the database
      await axiosInstance.delete(`${BASE_URL}/me/notifications`);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  // NEW: Make sure to return the new functions here so the component can use them!
  return {
    notifications,
    unreadCount,
    markAsRead,
    loading,
    deleteNotification,
    clearAllNotifications
  };
};