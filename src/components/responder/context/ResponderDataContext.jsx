import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const deepClone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const createBaselineData = () => {
  const now = Date.now();
  return {
    incidents: [
      {
        id: "INC-4821",
        label: "Flash flood",
        location: "Barangay San Roque Creek",
        coordinates: { lat: 14.6557, lng: 121.0296 },
        severity: "critical",
        status: "en-route",
        priority: "critical",
        eta: "08 min",
        patientCount: 3,
        commander: "Lt. Ramos",
        assignedUnits: ["Medic 12", "Rescue 4"],
        reporters: "Team Bravo",
        lastUpdate: new Date(now - 1000 * 60 * 2).toISOString(),
      },
      {
        id: "INC-4818",
        label: "Landslide watch",
        location: "Riverbank North Access",
        coordinates: { lat: 14.6593, lng: 121.0417 },
        severity: "high",
        status: "on-scene",
        priority: "high",
        eta: "On scene",
        patientCount: 1,
        commander: "Sgt. Bernardo",
        assignedUnits: ["Scout Echo"],
        reporters: "LGU quick response",
        lastUpdate: new Date(now - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "INC-4804",
        label: "Heat exhaustion",
        location: "Sta. Elena Covered Court",
        coordinates: { lat: 14.6661, lng: 121.044 },
        severity: "moderate",
        status: "handover",
        priority: "moderate",
        eta: "Handover",
        patientCount: 2,
        commander: "PO3 Salcedo",
        assignedUnits: ["Medic 7"],
        reporters: "Scout volunteers",
        lastUpdate: new Date(now - 1000 * 60 * 14).toISOString(),
      },
      {
        id: "INC-4799",
        label: "Minor injury",
        location: "San Isidro Health Post",
        coordinates: { lat: 14.6481, lng: 121.0252 },
        severity: "low",
        status: "completed",
        priority: "routine",
        eta: "Closed",
        patientCount: 0,
        commander: "Nurse Dela Cruz",
        assignedUnits: ["Nurse mobile"],
        reporters: "Barangay desk",
        lastUpdate: new Date(now - 1000 * 60 * 26).toISOString(),
      },
    ],
    roster: [
      {
        name: "Team Alpha",
        members: 4,
        status: "on-scene",
        location: "Landslide Sector 2",
        vitals: "All stable",
        lastPing: "1 min ago",
      },
      {
        name: "Team Bravo",
        members: 3,
        status: "en-route",
        location: "San Roque Evac Lane",
        vitals: "Pulse elevated",
        lastPing: "3 min ago",
      },
      {
        name: "Medic Delta",
        members: 2,
        status: "triage",
        location: "Sta. Elena Court",
        vitals: "Hydration ok",
        lastPing: "Now",
      },
      {
        name: "Scout Echo",
        members: 2,
        status: "patrol",
        location: "Riverbank perimeter",
        vitals: "Need restock",
        lastPing: "6 min ago",
      },
    ],
    patients: [
      {
        id: "PT-209",
        name: "Ramon Villarin",
        age: 42,
        condition: "Crush injury",
        triage: "red",
        vitals: { hr: 118, bp: "90/60", spo2: 94 },
        destination: "General Hospital",
        notes: "Stabilized limb, IV fluids running",
      },
      {
        id: "PT-214",
        name: "Jenny Laxamana",
        age: 9,
        condition: "Asthma attack",
        triage: "yellow",
        vitals: { hr: 104, bp: "104/68", spo2: 96 },
        destination: "Sta. Elena Clinic",
        notes: "Neb treatment responded, monitor breathing",
      },
      {
        id: "PT-218",
        name: "Carlos de Guia",
        age: 67,
        condition: "Hypertension",
        triage: "green",
        vitals: { hr: 88, bp: "150/92", spo2: 97 },
        destination: "On-site monitoring",
        notes: "Administered meds, family informed",
      },
    ],
    safetyEvents: [
      {
        id: "SAFE-129",
        type: "geo-fence",
        message: "Team Bravo 40m from landslide edge",
        timestamp: "1 min ago",
        severity: "warning",
      },
      {
        id: "SAFE-124",
        type: "weather",
        message: "Lightning proximity within 5km",
        timestamp: "6 min ago",
        severity: "critical",
      },
      {
        id: "SAFE-120",
        type: "wellness",
        message: "Medic Delta hydration reminder",
        timestamp: "12 min ago",
        severity: "info",
      },
    ],
    teamLocations: [
      {
        name: "Team Alpha",
        coordinate: "14.6563° N, 121.0430° E",
        status: "safe lane",
      },
      {
        name: "Team Bravo",
        coordinate: "14.6541° N, 121.0484° E",
        status: "hazard nearby",
      },
      {
        name: "Scout Echo",
        coordinate: "14.6520° N, 121.0362° E",
        status: "patrol loop",
      },
    ],
    infrastructure: {
      floodSensors: 6,
      generatorStatus: "Nominal",
    },
    stagingHub: {
      id: "STAGING-ALPHA",
      name: "Kalinga Forward Command",
      coordinates: [14.6532, 121.0345],
    },
    hospitals: [
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
    ],
    comms: {
      channels: [
        {
          id: "medical",
          label: "Medical",
          description: "Vitals, triage, transport",
        },
        {
          id: "logistics",
          label: "Logistics",
          description: "Supply runs, gear requests",
        },
        {
          id: "safety",
          label: "Safety",
          description: "Security, hazard updates",
        },
        {
          id: "command",
          label: "Command",
          description: "Field command briefings",
        },
      ],
      presetMessages: [
        "Arrived on scene, beginning assessment.",
        "Requesting additional medics for mass casualty.",
        "Transport ready, patient stabilized and en route.",
      ],
      hotlines: [
        { id: "command", label: "Command desk", value: "*201" },
        { id: "medical", label: "Medical director", value: "*450" },
        { id: "safety", label: "Safety & security", value: "*911" },
      ],
    },
    resourceChecklists: [
      {
        id: "med",
        title: "Medical kit",
        icon: "ClipboardCheck",
        items: [
          "ALS kit sealed",
          "Ventilator battery > 70%",
          "IV fluids x4 bags",
          "Trauma dressings restocked",
        ],
      },
      {
        id: "gear",
        title: "Responder gear",
        icon: "Shield",
        items: ["PPE level 3", "Rope harness", "Thermal blanket", "Floodlight"],
      },
      {
        id: "log",
        title: "Vehicle & logistics",
        icon: "PackageCheck",
        items: [
          "Fuel > 60%",
          "Generator loaded",
          "Boat trailer attached",
          "Radio spare battery",
        ],
      },
    ],
  };
};

const demoTimeline = [
  {
    id: "briefing",
    title: "Shift briefing",
    summary:
      "Teams check in, equipment status verified, and assignments synced to tablets.",
  },
  {
    id: "dispatch",
    title: "Dispatch acknowledged",
    summary:
      "Team Bravo accelerates to the flood site and confirms arrival while command updates the map.",
    mutate: (draft) => {
      const target = draft.incidents.find(
        (incident) => incident.id === "INC-4821"
      );
      if (target) {
        target.status = "on-scene";
        target.eta = "Arrived";
        target.patientCount = 4;
        target.lastUpdate = new Date().toISOString();
      }
      const rosterTeam = draft.roster.find(
        (team) => team.name === "Team Bravo"
      );
      if (rosterTeam) {
        rosterTeam.status = "on-scene";
        rosterTeam.vitals = "Pulse stabilized";
        rosterTeam.lastPing = "Just now";
        rosterTeam.location = "San Roque creek bank";
      }
      draft.safetyEvents = [
        {
          id: "SAFE-134",
          type: "arrival",
          message: "Team Bravo on scene, establishing safe lane perimeter",
          timestamp: "seconds ago",
          severity: "info",
        },
        ...draft.safetyEvents,
      ];
      draft.teamLocations = draft.teamLocations.map((team) =>
        team.name === "Team Bravo"
          ? { ...team, status: "engaged response" }
          : team
      );
      draft.hospitals = draft.hospitals?.map((facility) => {
        if (facility.id === "HSP-QUEZONMED") {
          const nextBeds = Math.max(facility.availableBeds - 1, 0);
          return {
            ...facility,
            availableBeds: nextBeds,
            status: nextBeds <= 4 ? "busy" : facility.status,
          };
        }
        return facility;
      });
      return draft;
    },
  },
  {
    id: "medical",
    title: "Medical escalation",
    summary:
      "A new patient is flagged for evacuation and hospital capacity re-check begins.",
    mutate: (draft) => {
      const newIncident = {
        id: "INC-4832",
        label: "Evac support request",
        location: "Barangay Tatalon Primary School",
        coordinates: { lat: 14.6512, lng: 121.0388 },
        severity: "high",
        status: "en-route",
        priority: "high",
        eta: "12 min",
        patientCount: 1,
        commander: "Capt. Villarin",
        assignedUnits: ["Medic Delta"],
        reporters: "Barangay volunteers",
        lastUpdate: new Date().toISOString(),
      };
      draft.incidents = [newIncident, ...draft.incidents];
      draft.patients = [
        {
          id: "PT-233",
          name: "Lucia Fernando",
          age: 34,
          condition: "Hypothermia",
          triage: "yellow",
          vitals: { hr: 96, bp: "110/70", spo2: 95 },
          destination: "Quezon City General Hospital",
          notes: "Warming blankets applied, monitor for shivering",
        },
        ...draft.patients,
      ];
      draft.safetyEvents = [
        {
          id: "SAFE-140",
          type: "medical",
          message: "Evac support requested at Barangay Tatalon",
          timestamp: "moments ago",
          severity: "warning",
        },
        ...draft.safetyEvents,
      ];
      draft.teamLocations = [
        ...draft.teamLocations,
        {
          name: "Medic Delta",
          coordinate: "14.6512° N, 121.0388° E",
          status: "medical evac",
        },
      ];
      draft.hospitals = draft.hospitals?.map((facility) => {
        if (facility.id === "HSP-MMC") {
          return {
            ...facility,
            availableBeds: Math.max(facility.availableBeds - 2, 0),
            status: "busy",
          };
        }
        if (facility.id === "HSP-ROOSEVELT") {
          return {
            ...facility,
            status: "busy",
            availableBeds: Math.max(facility.availableBeds - 1, 0),
          };
        }
        return facility;
      });
      return draft;
    },
  },
  {
    id: "handover",
    title: "Handover & relief",
    summary:
      "Primary incident stabilizes, patients transferred, and teams rotate for relief.",
    mutate: (draft) => {
      const floodIncident = draft.incidents.find(
        (incident) => incident.id === "INC-4821"
      );
      if (floodIncident) {
        floodIncident.status = "handover";
        floodIncident.severity = "moderate";
        floodIncident.eta = "Relief inbound";
        floodIncident.lastUpdate = new Date().toISOString();
      }
      draft.roster = draft.roster.map((team) => {
        if (team.name === "Team Alpha") {
          return {
            ...team,
            vitals: "Request brief rest",
            lastPing: "2 min ago",
          };
        }
        if (team.name === "Team Bravo") {
          return {
            ...team,
            status: "relief",
            location: "Safe lane staging",
            vitals: "Standing down",
            lastPing: "Moments ago",
          };
        }
        if (team.name === "Medic Delta") {
          return {
            ...team,
            status: "transport",
            location: "Quezon City General Hospital",
            vitals: "Patient stable",
            lastPing: "Moments ago",
          };
        }
        return team;
      });
      draft.patients = draft.patients.map((patient) => {
        if (patient.id === "PT-209") {
          return {
            ...patient,
            destination: "Transferred to Quezon City General",
            notes: "Handover complete, surgeon briefed",
          };
        }
        return patient;
      });
      draft.safetyEvents = [
        {
          id: "SAFE-148",
          type: "status",
          message: "Flood sector stabilizing, relief team deploying",
          timestamp: "just now",
          severity: "info",
        },
        ...draft.safetyEvents.slice(0, 4),
      ];
      draft.teamLocations = draft.teamLocations.map((team) =>
        team.name === "Team Bravo"
          ? { ...team, status: "relief staging" }
          : team
      );
      draft.hospitals = draft.hospitals?.map((facility) => {
        if (facility.id === "HSP-ROOSEVELT") {
          return {
            ...facility,
            status: "accepting",
            availableBeds: facility.availableBeds + 2,
          };
        }
        if (facility.id === "HSP-QUEZONMED") {
          const nextBeds = facility.availableBeds + 1;
          return {
            ...facility,
            availableBeds: nextBeds,
            status: nextBeds > 6 ? "accepting" : facility.status,
          };
        }
        return facility;
      });
      draft.infrastructure = {
        ...draft.infrastructure,
        generatorStatus: "Recharging",
      };
      return draft;
    },
  },
];

const ResponderDataContext = createContext(null);

export const ResponderDataProvider = ({ children }) => {
  const baselineRef = useRef(createBaselineData());
  const [data, setData] = useState(() => deepClone(baselineRef.current));
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [weatherSnapshot, setWeatherSnapshot] = useState(null);
  const intervalRef = useRef(null);
  const kickoffRef = useRef(null);

  const applyDemoSteps = useMemo(() => {
    return (stepIndex) => {
      let draft = deepClone(baselineRef.current);
      if (!stepIndex) {
        return draft;
      }
      for (let i = 1; i <= stepIndex && i < demoTimeline.length; i += 1) {
        const step = demoTimeline[i];
        if (step?.mutate) {
          draft = step.mutate(draft);
        }
      }
      return draft;
    };
  }, []);

  useEffect(() => {
    setData(applyDemoSteps(demoStep));
  }, [demoStep, applyDemoSteps]);

  useEffect(() => {
    if (!demoActive) {
      clearInterval(intervalRef.current);
      clearTimeout(kickoffRef.current);
      intervalRef.current = null;
      kickoffRef.current = null;
      setDemoStep(0);
      setData(deepClone(baselineRef.current));
      return () => {};
    }

    setDemoStep(0);
    setData(deepClone(baselineRef.current));

    kickoffRef.current = setTimeout(() => {
      setDemoStep(1);
    }, 700);

    intervalRef.current = setInterval(() => {
      setDemoStep((prev) => {
        const next = prev + 1;
        if (next >= demoTimeline.length) {
          return 1;
        }
        return next;
      });
    }, 12000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(kickoffRef.current);
      intervalRef.current = null;
      kickoffRef.current = null;
    };
  }, [demoActive]);

  const startDemo = () => {
    setDemoActive(true);
  };

  const stopDemo = () => {
    setDemoActive(false);
  };

  const resetDemo = () => {
    setDemoActive(false);
    setDemoStep(0);
    setData(deepClone(baselineRef.current));
  };

  const advanceStep = () => {
    setDemoActive(false);
    setDemoStep((prev) => {
      const next = Math.min(prev + 1, demoTimeline.length - 1);
      return next;
    });
  };

  const rewindStep = () => {
    setDemoActive(false);
    setDemoStep((prev) => Math.max(prev - 1, 0));
  };

  const value = useMemo(
    () => ({
      data,
      demoActive,
      demoStep,
      demoTimeline,
      startDemo,
      stopDemo,
      resetDemo,
      advanceStep,
      rewindStep,
      updateWeatherSnapshot: setWeatherSnapshot,
      weatherSnapshot,
    }),
    [data, demoActive, demoStep, weatherSnapshot]
  );

  return (
    <ResponderDataContext.Provider value={value}>
      {children}
    </ResponderDataContext.Provider>
  );
};

export const useResponderData = () => {
  const context = useContext(ResponderDataContext);
  if (!context) {
    throw new Error(
      "useResponderData must be used within a ResponderDataProvider"
    );
  }
  return context;
};
