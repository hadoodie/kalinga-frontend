import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "../../../services/adminService";

// Role badge styling
const roleBadges = {
  admin: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  responder: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  patient: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  logistics: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
};

// Status badge styling
const statusBadges = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  inactive: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  verified: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
};

// Verification status styling
const verificationBadges = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  verified:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  unverified:
    "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Create User Modal Component
const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await adminService.createUser(formData);
      onUserCreated();
      onClose();
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "patient",
        phone: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-11 rounded-xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full h-11 rounded-xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full h-11 rounded-xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full h-11 rounded-xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
            >
              <option value="patient">Patient</option>
              <option value="responder">Responder</option>
              <option value="logistics">Logistics</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full h-11 rounded-xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
              placeholder="+63 XXX XXX XXXX"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-border/60 text-sm font-medium text-foreground/70 hover:bg-primary/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch users from backend
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
      };
      if (roleFilter) params.role = roleFilter;

      const response = await adminService.getAllUsers(params);
      setUsers(response.data || []);
      setTotalPages(response.last_page || 1);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, roleFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const userStats = await adminService.getUserStats();
      setStats(userStats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Handle activate/deactivate
  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user.id);
      } else {
        await adminService.activateUser(user.id);
      }
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("Error toggling user status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users by search query (client-side for responsiveness)
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="User & Role Management"
        description="Control privileged access and coordinate multi-agency collaboration. Provision accounts, assign granular roles, and track presence across the command chain."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <Shield className="h-4 w-4" />
              Role matrix
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              <UserPlus className="h-4 w-4" />
              Add operator
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-sm text-foreground/60">Total Users</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <UserCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.active}
              </p>
              <p className="text-sm text-foreground/60">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
              <Shield className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.byRole?.responder || 0}
              </p>
              <p className="text-sm text-foreground/60">Responders</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.pendingVerification}
              </p>
              <p className="text-sm text-foreground/60">Pending Verification</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                placeholder="Search users by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border/60 bg-background/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-full border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="responder">Responder</option>
              <option value="patient">Patient</option>
              <option value="logistics">Logistics</option>
            </select>
          </div>
          <button className="hidden h-11 rounded-full border border-border/60 px-4 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary md:inline-flex md:items-center md:gap-2">
            <UserCog className="h-4 w-4" />
            Bulk actions
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 text-rose-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-6 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !error && (
          <>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-foreground/60">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Verification</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-background/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-foreground/60"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-primary/5 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">
                                {user.name}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              roleBadges[user.role] ||
                              "bg-gray-500/10 text-gray-600"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.is_active
                                ? statusBadges.active
                                : statusBadges.inactive
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              verificationBadges[user.verification_status] ||
                              verificationBadges.unverified
                            }`}
                          >
                            {user.verification_status || "Unverified"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {formatRelativeTime(user.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.id}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              user.is_active
                                ? "border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                                : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : user.is_active ? (
                              <UserMinus className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-foreground/60">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-primary/10 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-primary/10 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
};
