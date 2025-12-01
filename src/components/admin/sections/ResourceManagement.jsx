import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Droplet,
  Loader2,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "../../../services/adminService";

// Category icons mapping
const categoryIcons = {
  "Medical Supplies": ClipboardList,
  "Food & Water": Droplet,
  Equipment: Boxes,
  Transportation: Truck,
  Shelter: Warehouse,
  default: PackageCheck,
};

// Status badge styling
const statusBadges = {
  "In Stock":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Low Stock":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  "Out of Stock":
    "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `${diffDays} days`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return date.toLocaleDateString();
};

export const ResourceManagement = () => {
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [critical, setCritical] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Fetch resources and stats
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        resourceData,
        resourceStats,
        lowStockData,
        criticalData,
        expiringData,
      ] = await Promise.all([
        adminService.getResources(),
        adminService.getResourceStats(),
        adminService.getLowStockResources(),
        adminService.getCriticalResources(),
        adminService.getExpiringResources(30),
      ]);

      setResources(resourceData);
      setStats(resourceStats);
      setLowStock(lowStockData);
      setCritical(criticalData);
      setExpiring(expiringData);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort resources
  const filteredResources = resources
    .filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const compare =
        typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortOrder === "asc" ? compare : -compare;
    });

  // Group by category for overview
  const categories = [
    ...new Set(resources.map((r) => r.category || "Uncategorized")),
  ];

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Toggle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Resource Management"
        description="Prioritize, mobilize, and audit critical resources. Track inventory levels, expiring items, and stock alerts across all facilities."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
              <Truck className="h-4 w-4" />
              Launch logistics board
            </button>
          </div>
        }
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-sm text-foreground/60">Total Items</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.lowStock}
              </p>
              <p className="text-sm text-foreground/60">Low Stock</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.critical}
              </p>
              <p className="text-sm text-foreground/60">Critical</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.expiring}
              </p>
              <p className="text-sm text-foreground/60">Expiring Soon</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Resource List */}
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border/60 bg-background/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 rounded-full border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {isLoading && resources.length === 0 && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Resources Table */}
          {!isLoading && (
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Inventory List
              </h3>

              {filteredResources.length === 0 ? (
                <p className="text-center py-8 text-foreground/60">
                  No resources found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60 text-sm">
                    <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-foreground/60">
                      <tr>
                        <th
                          className="px-4 py-3 font-medium cursor-pointer hover:text-primary"
                          onClick={() => handleSort("name")}
                        >
                          <span className="flex items-center gap-1">
                            Name
                            {sortField === "name" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              ))}
                          </span>
                        </th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th
                          className="px-4 py-3 font-medium cursor-pointer hover:text-primary"
                          onClick={() => handleSort("quantity")}
                        >
                          <span className="flex items-center gap-1">
                            Qty
                            {sortField === "quantity" &&
                              (sortOrder === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              ))}
                          </span>
                        </th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-background/50">
                      {filteredResources.slice(0, 10).map((resource) => (
                        <tr
                          key={resource.id}
                          className="hover:bg-primary/5 transition"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {resource.name}
                              </p>
                              {resource.sku && (
                                <p className="text-xs text-foreground/60">
                                  {resource.sku}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground/70">
                            {resource.category || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">
                              {resource.quantity} {resource.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground/70">
                            {resource.location || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                statusBadges[resource.status] ||
                                statusBadges["In Stock"]
                              }`}
                            >
                              {resource.status || "In Stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground/60 text-xs">
                            {resource.expiry_date
                              ? formatRelativeTime(resource.expiry_date)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredResources.length > 10 && (
                <p className="mt-4 text-xs text-foreground/50">
                  Showing 10 of {filteredResources.length} resources
                </p>
              )}
            </div>
          )}

          {/* Category Breakdown */}
          {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                By Category
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.byCategory).map(([category, count]) => {
                  const Icon = categoryIcons[category] || categoryIcons.default;
                  const percentage = Math.round((count / stats.total) * 100);

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {category}
                          </span>
                        </div>
                        <span className="text-sm text-foreground/70">
                          {count} items ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Low Stock Alerts */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Low Stock Alerts
              </h3>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-foreground/60">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {item.location}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical Items */}
          {critical.length > 0 && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h3 className="text-lg font-semibold text-rose-600">
                  Critical Items
                </h3>
              </div>
              <div className="space-y-3">
                {critical.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {item.location}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-rose-600">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Expiring Soon
              </h3>
            </div>
            {expiring.length === 0 ? (
              <p className="text-sm text-foreground/60">
                No items expiring within 30 days
              </p>
            ) : (
              <div className="space-y-3">
                {expiring.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/20"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {item.location}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-purple-600">
                      {formatRelativeTime(item.expiry_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Facility Capacity */}
          {stats?.byLocation && Object.keys(stats.byLocation).length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Facility Capacity
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                Resources by location
              </p>
              <div className="mt-5 space-y-4 text-sm text-foreground/70">
                {Object.entries(stats.byLocation)
                  .slice(0, 5)
                  .map(([location, data]) => (
                    <div
                      key={location}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate max-w-[150px]">{location}</span>
                      <span className="font-semibold text-foreground">
                        {data.count} items ({data.quantity} units)
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
