import { useAuth } from "../context/AuthContext";

export default function ResponderDashboard() {
  const { user, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">
            Emergency Responder Dashboard
          </h1>
          <p className="text-muted-foreground mb-8">
            Welcome, {user?.name}! Manage emergency responses and coordinate
            relief efforts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Emergencies */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Active Emergencies</h3>
              <p className="text-sm opacity-90 mb-4">
                View and respond to active emergency reports
              </p>
              <div className="text-4xl font-bold mb-4">0</div>
              <button className="bg-white text-red-600 px-4 py-2 rounded hover:bg-red-50 transition">
                View All
              </button>
            </div>

            {/* Emergency Reports */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Recent Reports</h3>
              <p className="text-sm opacity-90 mb-4">
                Review incoming emergency reports
              </p>
              <div className="text-4xl font-bold mb-4">0</div>
              <button className="bg-white text-orange-600 px-4 py-2 rounded hover:bg-orange-50 transition">
                View Reports
              </button>
            </div>

            {/* Resource Requests */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Resource Requests</h3>
              <p className="text-sm opacity-90 mb-4">
                Manage resource allocation requests
              </p>
              <div className="text-4xl font-bold mb-4">0</div>
              <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">
                Manage Requests
              </button>
            </div>

            {/* Evacuation Centers */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Evacuation Centers</h3>
              <p className="text-sm opacity-90 mb-4">
                Monitor evacuation center status
              </p>
              <div className="text-4xl font-bold mb-4">0</div>
              <button className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-50 transition">
                View Centers
              </button>
            </div>

            {/* Team Communication */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Team Communication</h3>
              <p className="text-sm opacity-90 mb-4">
                Coordinate with response teams
              </p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded hover:bg-purple-50 transition">
                Open Chat
              </button>
            </div>

            {/* Medical Facilities */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Medical Facilities</h3>
              <p className="text-sm opacity-90 mb-4">
                Check hospital and clinic capacity
              </p>
              <button className="bg-white text-teal-600 px-4 py-2 rounded hover:bg-teal-50 transition">
                View Facilities
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-red-900">No Active Alerts</h4>
                <p className="text-sm text-red-700">All systems operational</p>
              </div>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                Report Emergency
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">
                Responses Today
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">
                Active Teams
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">
                People Assisted
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">--</div>
              <div className="text-sm text-muted-foreground mt-1">
                Resources Deployed
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a placeholder responder dashboard.
              Full responder features will be implemented in future updates.
            </p>
          </div>
          <div className="Logout">
            <button
              onClick={() => handleLogout()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
