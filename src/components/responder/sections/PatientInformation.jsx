import { useMemo } from "react";
import {
  ClipboardList,
  HeartPulse,
  Droplet,
  Thermometer,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

const PATIENTS = [
  {
    id: "PT-209",
    name: "Ramon Villarin",
    age: 42,
    condition: "Crush injury",
    triage: "red",
    vitals: {
      hr: 118,
      bp: "90/60",
      spo2: 94,
    },
    destination: "General Hospital",
    notes: "Stabilized limb, IV fluids running",
  },
  {
    id: "PT-214",
    name: "Jenny Laxamana",
    age: 9,
    condition: "Asthma attack",
    triage: "yellow",
    vitals: {
      hr: 104,
      bp: "104/68",
      spo2: 96,
    },
    destination: "Sta. Elena Clinic",
    notes: "Neb treatment responded, monitor breathing",
  },
  {
    id: "PT-218",
    name: "Carlos de Guia",
    age: 67,
    condition: "Hypertension",
    triage: "green",
    vitals: {
      hr: 88,
      bp: "150/92",
      spo2: 97,
    },
    destination: "On-site monitoring",
    notes: "Administered meds, family informed",
  },
];

const triageStyles = {
  red: "bg-rose-500/10 text-rose-600",
  yellow: "bg-amber-500/10 text-amber-600",
  green: "bg-emerald-500/10 text-emerald-600",
};

export const PatientInformation = () => {
  const totals = useMemo(() => {
    return {
      total: PATIENTS.length,
      critical: PATIENTS.filter((patient) => patient.triage === "red").length,
      observed: PATIENTS.filter((patient) =>
        patient.destination.includes("On-site")
      ).length,
    };
  }, []);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Patient Information"
        description="Active patient roster linked to your current assignments. Keep vitals updated and flag when transfer is completed."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={ClipboardList}
          label="Patients tracked"
          value={`${totals.total}`}
          change="Live"
          tone="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={`${totals.critical}`}
          change="Immediate attention"
          tone="danger"
        />
        <StatCard
          icon={Activity}
          label="Under observation"
          value={`${totals.observed}`}
          change="0 transfers"
          tone="warning"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-foreground/5 text-foreground/70">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Patient</th>
              <th className="px-4 py-3 text-left font-semibold">Condition</th>
              <th className="px-4 py-3 text-left font-semibold">Vitals</th>
              <th className="px-4 py-3 text-left font-semibold">Destination</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {PATIENTS.map((patient) => (
              <tr key={patient.id} className="hover:bg-foreground/5">
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {patient.name}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {patient.id} • {patient.age} yrs
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <span className="text-foreground/80">
                      {patient.condition}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
                        triageStyles[patient.triage]
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {patient.triage.toUpperCase()} triage
                    </span>
                    <p className="text-xs text-foreground/50">
                      {patient.notes}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
                      <HeartPulse className="h-3 w-3" /> {patient.vitals.hr} bpm
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
                      <Droplet className="h-3 w-3" /> {patient.vitals.bp}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
                      <Thermometer className="h-3 w-3" /> SpO₂{" "}
                      {patient.vitals.spo2}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-foreground/70">
                  {patient.destination}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
                      Update vitals
                    </button>
                    <button className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-foreground/70 transition hover:border-primary/40 hover:text-primary">
                      Mark transfer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
