import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import api from "../services/api"; 

export default function Notifs() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');

        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []); // Empty array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Page Header */}
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
            Notifications
          </h1>
          <button className="px-4 py-2 text-sm rounded-md bg-green-900 text-white hover:bg-green-700 transition">
            Mark all as read
          </button>
        </header>

        {/* Notifications List */}
        <div className="p-6 text-center text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          Notifications
        </h1>
        <button className="px-4 py-2 text-sm rounded-md bg-green-900 text-white hover:bg-green-700 transition">
          Mark all as read
        </button>
      </header>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {notifications.length > 0 ? (
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