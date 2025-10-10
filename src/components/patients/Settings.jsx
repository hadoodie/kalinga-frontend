import { Shield, User, Bell, Cog, Lock } from "lucide-react";

export default function PatientSetting() {
  const sections = [
    {
      title: "Account & Security",
      icon: <Shield size={18} className="text-green-600 mr-2" />,
      items: ["Personal Information", "Logged in Devices"],
    },
    {
      title: "Professional Information",
      icon: <User size={18} className="text-green-600 mr-2" />,
      items: ["Role and Position", "Availability"],
    },
    {
      title: "Notifications",
      icon: <Bell size={18} className="text-green-600 mr-2" />,
      items: [
        "Notification Type",
        "Priority Alerts",
        "Mute / Snooze",
        "Reminders",
      ],
    },
    {
      title: "System Preferences",
      icon: <Cog size={18} className="text-green-600 mr-2" />,
      items: ["Language", "Theme"],
    },
    {
      title: "Privacy and Data",
      icon: <Lock size={18} className="text-green-600 mr-2" />,
      items: ["Visibility Settings"],
    },
  ];

  return (
    <div className="p-5 bg-gray-50 min-h-[calc(100vh-140px)] font-sans text-left">
        <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Settings</h1>
        </header>

      {/* Search Bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Find the setting you need"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Settings Sections */}
      {sections.map((section, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm"
        >
          <h3 className="flex items-center text-base font-semibold mb-3 text-gray-900">
            {section.icon}
            {section.title}
          </h3>

          <ul className="list-none p-0 m-0">
            {section.items.map((item, idx) => (
              <li
                key={idx}
                className={`py-2 text-sm text-gray-700 border-t border-gray-200 cursor-pointer hover:text-green-600 transition ${
                  idx === 0 ? "border-t-0" : ""
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
