import { Bell, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import api from "../services/api"; 

export default function Notifs() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true); // Set loading to true at the start
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false); // Set loading to false at the end
      }
    };

    fetchNotifications();
  }, []); // Empty array means this runs once on mount

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-center p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary flex items-center gap-3">
          <Bell className="w-8 h-8" />
          Notifications
        </h1>
        <button className="mt-3 md:mt-0 px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-green-700 transition">
          Mark all as read
        </button>
      </header>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex flex-col text-left sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">
                  {notif.title}
                </h3>
                <p className="text-sm text-gray-600">{notif.description}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-gray-500">No notifications yet</p>
        )}
      </div>
    </div>
  );
}