import { Plus, Search, Shield, UserCog, UserPlus } from "lucide-react";
import { SectionHeader } from "../SectionHeader";

const userRows = [
  {
    name: "Maria Santos",
    email: "m.santos@kalinga.gov",
    role: "Operations Chief",
    status: "Active",
    lastActive: "2m ago",
  },
  {
    name: "Jun Dela Cruz",
    email: "jun.dc@kalinga.gov",
    role: "Logistics Lead",
    status: "On Duty",
    lastActive: "8m ago",
  },
  {
    name: "Aya Suarez",
    email: "aya.suarez@kalinga.gov",
    role: "Intelligence Officer",
    status: "Active",
    lastActive: "15m ago",
  },
  {
    name: "Team Delta",
    email: "team.delta@kalinga.gov",
    role: "Responder Group",
    status: "Field",
    lastActive: "Live",
  },
  {
    name: "Barangay Captains",
    email: "brgy.captains@kalinga.gov",
    role: "Stakeholder",
    status: "Linked",
    lastActive: "1h ago",
  },
];

const roleBadges = {
  "Operations Chief":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  "Logistics Lead": "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  "Intelligence Officer":
    "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  "Responder Group": "bg-orange-500/10 text-orange-600 dark:text-orange-300",
  Stakeholder: "bg-primary/10 text-primary",
};

const statusBadges = {
  Active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "On Duty": "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  Linked: "bg-primary/10 text-primary",
  Field: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Live: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export const UserRoleManagement = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="User & Role Management"
        description="Control privileged access and coordinate multi-agency collaboration. Provision accounts, assign granular roles, and track presence across the command chain."
        actions={
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
              <Shield className="h-4 w-4" />
              Role matrix
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
              <UserPlus className="h-4 w-4" />
              Add operator
            </button>
          </div>
        }
      />

      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                placeholder="Search operators, teams, or groups"
                className="h-11 w-full rounded-full border border-border/60 bg-background/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <button className="hidden h-11 rounded-full border border-border/60 px-4 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary md:inline-flex md:items-center md:gap-2">
              <UserCog className="h-4 w-4" />
              Bulk actions
            </button>
          </div>
          <button className="flex h-11 items-center gap-2 rounded-full border border-border/60 px-4 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary">
            <Plus className="h-4 w-4" />
            Invite external partner
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-primary/5 text-left text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th className="px-6 py-3 font-medium">User / Team</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last active</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background/50">
              {userRows.map((row) => (
                <tr key={row.email}>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {row.name}
                      </p>
                      <p className="text-xs text-foreground/60">{row.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        roleBadges[row.role]
                      }`}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusBadges[row.status]
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/60">
                    {row.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right text-foreground/70">
                    <button className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium transition hover:border-primary/40 hover:text-primary">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
