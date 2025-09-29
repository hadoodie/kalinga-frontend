import { Fragment, useMemo } from "react";
import { Ambulance, Hospital, MapPin, Phone, Stethoscope } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";

const STAGING_HUB = {
  id: "STAGING-ALPHA",
  name: "Kalinga Forward Command",
  coordinates: [14.6532, 121.0345],
};

const HOSPITALS = [
  {
    id: "HSP-QUEZONMED",
    name: "Quezon City General Hospital",
    coordinates: [14.6548, 121.0315],
    status: "accepting",
    contact: "(02) 8701 4400",
    travelTime: "6 min",
    availableBeds: 18,
    totalBeds: 32,
    specialties: ["Trauma", "Dialysis"],
  },
  {
    id: "HSP-MMC",
    name: "Metro Medical Center",
    coordinates: [14.6489, 121.0446],
    status: "busy",
    contact: "(02) 8895 6601",
    travelTime: "9 min",
    availableBeds: 6,
    totalBeds: 28,
    specialties: ["Cardiac", "Surgery"],
  },
  {
    id: "HSP-ROOSEVELT",
    name: "Roosevelt Triage Site",
    coordinates: [14.6634, 121.0263],
    status: "divert",
    contact: "VHF Channel 5",
    travelTime: "12 min",
    availableBeds: 2,
    totalBeds: 20,
    specialties: ["Respiratory"],
  },
  {
    id: "HSP-NKP",
    name: "National Kidney Institute",
    coordinates: [14.6365, 121.0456],
    status: "accepting",
    contact: "(02) 8981 0300",
    travelTime: "15 min",
    availableBeds: 11,
    totalBeds: 40,
    specialties: ["Critical care"],
  },
];

const statusTokens = {
  accepting: {
    label: "Accepting",
    color: "#22c55e",
    badge: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
    tone: "success",
  },
  busy: {
    label: "Busy",
    color: "#f97316",
    badge: "bg-amber-500/15 text-amber-600 border border-amber-500/20",
    tone: "warning",
  },
  divert: {
    label: "On divert",
    color: "#e11d48",
    badge: "bg-rose-500/15 text-rose-600 border border-rose-500/20",
    tone: "danger",
  },
};

export const HospitalMap = () => {
  const totalCapacity = useMemo(
    () =>
      HOSPITALS.reduce(
        (acc, item) => {
          acc.available += item.availableBeds;
          acc.total += item.totalBeds;
          if (item.status === "accepting") acc.accepting += 1;
          if (item.status === "busy") acc.busy += 1;
          if (item.status === "divert") acc.divert += 1;
          return acc;
        },
        { available: 0, total: 0, accepting: 0, busy: 0, divert: 0 }
      ),
    []
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Hospital & Treatment Map"
        description="Nearest receiving facilities with current bed availability and radio hand-off details."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Hospital}
          label="Facilities accepting"
          value={totalCapacity.accepting}
          change={`${HOSPITALS.length} total`}
          tone="success"
        />
        <StatCard
          icon={Ambulance}
          label="Facilities on divert"
          value={totalCapacity.divert}
          change={`${totalCapacity.busy} busy`}
          tone="danger"
        />
        <StatCard
          icon={Stethoscope}
          label="Beds available"
          value={totalCapacity.available}
          change={`${totalCapacity.total} capacity`}
          tone="primary"
        />
        <StatCard
          icon={Phone}
          label="Hotline & VHF"
          value={HOSPITALS.length}
          change="Ready for escalation"
          tone="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-[24rem] overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm">
          <MapContainer
            center={[14.6535, 121.037]}
            zoom={13}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {HOSPITALS.map((hospital) => {
              const token = statusTokens[hospital.status];
              return (
                <Fragment key={hospital.id}>
                  <CircleMarker
                    center={[hospital.coordinates[0], hospital.coordinates[1]]}
                    radius={12}
                    pathOptions={{
                      color: token.color,
                      fillColor: token.color,
                      fillOpacity: 0.3,
                      weight: 1.2,
                    }}
                  >
                    <Tooltip
                      className="bg-background text-foreground"
                      opacity={0.95}
                    >
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-foreground">
                          {hospital.name}
                        </p>
                        <p className="text-foreground/60">
                          {token.label} • {hospital.availableBeds}/
                          {hospital.totalBeds} beds
                        </p>
                        <p className="text-foreground/50">
                          ETA from hub: {hospital.travelTime}
                        </p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                  <Polyline
                    positions={[STAGING_HUB.coordinates, hospital.coordinates]}
                    pathOptions={{
                      color: token.color,
                      weight: hospital.status === "divert" ? 1 : 2,
                      opacity: hospital.status === "divert" ? 0.4 : 0.7,
                      dashArray: hospital.status === "busy" ? "6 6" : undefined,
                    }}
                  />
                </Fragment>
              );
            })}
            <CircleMarker
              center={[STAGING_HUB.coordinates[0], STAGING_HUB.coordinates[1]]}
              radius={14}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#2563eb",
                fillOpacity: 0.35,
                weight: 2,
              }}
            >
              <Tooltip className="bg-background text-foreground" opacity={0.95}>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-foreground">
                    {STAGING_HUB.name}
                  </p>
                  <p className="text-foreground/60">Forward staging hub</p>
                </div>
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>

        <div className="flex flex-col gap-4">
          {HOSPITALS.map((hospital) => {
            const token = statusTokens[hospital.status];
            return (
              <article
                key={hospital.id}
                className="rounded-3xl border border-border/60 bg-card/70 p-5 text-sm shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                      {hospital.id}
                    </p>
                    <h3 className="text-base font-semibold text-foreground">
                      {hospital.name}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/60">
                      Travel time: {hospital.travelTime}
                    </p>
                  </div>
                  <span
                    className={`${token.badge} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {token.label}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-xs text-foreground/70 md:grid-cols-2">
                  <div className="space-y-1">
                    <p>
                      Beds: {hospital.availableBeds} / {hospital.totalBeds}
                    </p>
                    <p>Specialties: {hospital.specialties.join(", ")}</p>
                  </div>
                  <div className="space-y-1">
                    <p>Contact: {hospital.contact}</p>
                    <p>Route status: {token.label}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
