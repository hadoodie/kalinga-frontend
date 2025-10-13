import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthStatus() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-4 bg-yellow-100 rounded">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-red-100 rounded">
        <p className="font-bold">Not Authenticated</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 rounded">
      <p className="font-bold">✅ Authenticated</p>
      <div className="mt-2 space-y-1">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Name:</strong> {user?.name || "Not set"}</p>
        <p><strong>Status:</strong> {user?.account_status || "active"}</p>
      </div>
      <button
        onClick={logout}
        className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
