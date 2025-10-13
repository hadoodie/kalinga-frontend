import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Welcome, {user?.name}! You have full administrative access to the Kalinga system.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Management */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">User Management</h3>
              <p className="text-sm opacity-90 mb-4">
                Manage users, roles, and permissions
              </p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">
                Manage Users
              </button>
            </div>

            {/* System Settings */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">System Settings</h3>
              <p className="text-sm opacity-90 mb-4">
                Configure system-wide settings
              </p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded hover:bg-purple-50 transition">
                Settings
              </button>
            </div>

            {/* Reports */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Reports</h3>
              <p className="text-sm opacity-90 mb-4">
                View system analytics and reports
              </p>
              <button className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-50 transition">
                View Reports
              </button>
            </div>

            {/* Logistics Overview */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Logistics</h3>
              <p className="text-sm opacity-90 mb-4">
                Oversee resource management
              </p>
              <button className="bg-white text-yellow-600 px-4 py-2 rounded hover:bg-yellow-50 transition">
                View Logistics
              </button>
            </div>

            {/* Emergency Response */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Emergency Response</h3>
              <p className="text-sm opacity-90 mb-4">
                Monitor active emergencies
              </p>
              <button className="bg-white text-red-600 px-4 py-2 rounded hover:bg-red-50 transition">
                View Emergencies
              </button>
            </div>

            {/* Audit Logs */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Audit Logs</h3>
              <p className="text-sm opacity-90 mb-4">
                View system activity logs
              </p>
              <button className="bg-white text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition">
                View Logs
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">Total Users</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">Active Emergencies</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">Resources</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">Hospitals</div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a placeholder admin dashboard. Full admin features will be implemented in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
