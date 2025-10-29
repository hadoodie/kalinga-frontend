import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
// You'll need a library to format the time
import { formatDistanceToNow } from 'date-fns';

// 1. Remove the default notifications prop
export default function Notifs() {
  // 2. Set up state to hold notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. Fetch data when the component loads
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Get the token from local storage
        const token = localStorage.getItem('token'); 

        const response = await fetch('/api/notifications', {
          headers: {
            // Use the real token in the header
            'Authorization': `Bearer ${token}`, 
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []); // Empty array means this runs once on mount

  // 4. (Optional) Add a loading state
  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header (no changes) */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h1>
        <button className="px-4 py-2 text-sm rounded-md bg-green-900 text-white hover:bg-green-700 transition">
          Mark all as read
        </button>
      </div>

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
                {/* 5. Format the timestamp from the server */}
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