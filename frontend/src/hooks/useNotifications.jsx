
import { useEffect, useState } from "react";
import { io } from 'socket.io-client'
import axiosInstance from "../utils/axios";

const BASE_URL=import.meta.env.VITE_BASE_URL || "http://localhost:1111"

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
        const res=await axiosInstance.get(`${BASE_URL}/me/notifications`)

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

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);

    await axiosInstance.patch(`${BASE_URL}/me/notifications/read`);
  };

  return { notifications, unreadCount, markAsRead, loading };
};
