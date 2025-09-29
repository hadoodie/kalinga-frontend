import { Bell } from "lucide-react";

export default function Notifs({
  notifications = [
    {
      id: 1,
      title: "Typhoon Warning",
      description: "Signal #3 raised in your area. Stay indoors.",
      time: "2h ago",
    },
    {
      id: 2,
      title: "Relief Goods Distribution",
      description: "Distribution at Barangay Hall starts at 3PM.",
      time: "5h ago",
    },
    {
      id: 3,
      title: "Responder Alert",
      description: "Team dispatched near your location.",
      time: "1d ago",
    },
  ],
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
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
                {notif.time}
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
