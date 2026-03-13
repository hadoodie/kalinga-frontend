import { useCallback, useEffect, useRef, useState } from "react";
import { getEchoInstance, reconnectEcho } from "../services/echo";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/**
 * Hook to manage notifications with real-time WebSocket updates.
 * Falls back to initial fetch and provides a refetch method.
 *
 * @param {Object} options
 * @param {number} options.limit - Maximum notifications to keep (default: 20)
 * @param {boolean} options.enabled - Whether to enable the hook (default: true)
 * @returns {Object} - { notifications, loading, error, refetch, unreadCount, markAsRead, markAllAsRead }
 */
export const useNotifications = ({ limit = 20, enabled = true } = {}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const subscriptionRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get("/notifications");
      const data = Array.isArray(response.data)
        ? response.data.slice(0, limit)
        : [];

      if (isMountedRef.current) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read_at).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      if (isMountedRef.current) {
        setError(err?.message || "Failed to load notifications");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, limit]);

  // Add a new notification from WebSocket
  const addNotification = useCallback(
    (notification) => {
      if (!notification) return;

      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        const updated = [notification, ...prev].slice(0, limit);
        return updated;
      });

      if (!notification.read_at) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [limit]
  );

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  // Handle incoming WebSocket notification
  const handleRealtimeNotification = useCallback(
    (payload) => {
      if (payload?.notification) {
        addNotification(payload.notification);
      }
    },
    [addNotification]
  );

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && isAuthenticated && !authLoading) {
      fetchNotifications();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, isAuthenticated, authLoading, fetchNotifications]);

  // Subscribe to WebSocket channel for real-time notifications
  useEffect(() => {
    if (!enabled || !isAuthenticated || authLoading || !user?.id) {
      return;
    }

    const echo = getEchoInstance?.();
    if (!echo) {
      return;
    }

    reconnectEcho();

    const channelName = `notifications.user.${user.id}`;
    let channel;

    try {
      channel = echo.private(channelName);
      channel.listen(".NotificationReceived", handleRealtimeNotification);
      subscriptionRef.current = channel;
    } catch (subscriptionError) {
      console.error(
        "Failed to subscribe to notifications channel",
        subscriptionError
      );
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.stopListening(".NotificationReceived");
        } catch (e) {
          // Ignore
        }
        try {
          echo.leave(channelName);
        } catch (e) {
          // Ignore
        }
        subscriptionRef.current = null;
      }
    };
  }, [
    enabled,
    isAuthenticated,
    authLoading,
    user?.id,
    handleRealtimeNotification,
  ]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
};

export default useNotifications;
