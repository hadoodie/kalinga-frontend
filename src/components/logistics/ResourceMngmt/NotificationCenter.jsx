// src/components/logistics/ResourceMngmt/NotificationCenter.jsx
import React, { useState } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  X,
} from "lucide-react";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Note: Real-time notifications are handled by the useNotifications hook
  // (Echo/Reverb). This component only renders the notification UI.
  // No raw WebSocket connection needed here.

  const handleNewNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]);
    setUnreadCount((prev) => prev + 1);

    // Auto-dismiss certain notifications
    if (notification.autoDismiss) {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, 10000); // 10 seconds
    }
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationConfig = (type) => {
    const configs = {
      match: {
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        icon: <Package className="w-5 h-5 text-green-600" />,
        textColor: "text-green-800",
      },
      approved: {
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        textColor: "text-green-800",
      },
      vehicle_assigned: {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        icon: <Truck className="w-5 h-5 text-blue-600" />,
        textColor: "text-blue-800",
      },
      in_transit: {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        icon: <MapPin className="w-5 h-5 text-blue-600" />,
        textColor: "text-blue-800",
      },
      arriving: {
        bgColor: "bg-purple-50",
        borderColor: "border-purple-300",
        icon: <Clock className="w-5 h-5 text-purple-600" />,
        textColor: "text-purple-800",
      },
      release_request: {
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        textColor: "text-red-800",
      },
      delivery_confirmed: {
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        textColor: "text-emerald-800",
      },
    };
    return configs[type] || configs.match;
  };

  // Banner notifications (auto-show for critical events)
  const bannerNotifications = notifications
    .filter((n) => n.type === "release_request" || n.type === "arriving")
    .slice(0, 2); // Show max 2 banners

  return (
    <>
      {/* Audio notification removed — file not available */}

      {/* Banner Notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2 w-96">
        {bannerNotifications.map((notification) => {
          const config = getNotificationConfig(notification.type);
          return (
            <div
              key={notification.id}
              className={`${config.bgColor} border ${config.borderColor} rounded-xl shadow-xl p-4 animate-slide-in`}
            >
              <div className="flex items-start gap-3">
                {config.icon}
                <div className="flex-1">
                  <p className={`font-bold ${config.textColor}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bell Icon */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 text-gray-700 hover:text-green-600 transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowPanel(false)}
            />
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-300 z-40">
              <div className="p-4 border-b border-gray-300">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-green-600 hover:text-green-800 font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => setShowPanel(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const config = getNotificationConfig(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-200 hover:bg-gray-50 ${
                          !notification.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${config.textColor}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p
                                className={`font-semibold ${config.textColor}`}
                              >
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <div className="mt-2">
                                <button
                                  onClick={() =>
                                    (window.location.href =
                                      notification.action.url)
                                  }
                                  className="text-sm text-green-600 hover:text-green-800 font-semibold"
                                >
                                  {notification.action.label} →
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-gray-300 hover:text-gray-500"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotificationCenter;
