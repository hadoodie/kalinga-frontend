// src/services/mockAssetService.js - ENHANCED WITH 50+ SAMPLE DATA
// Mock data simulating backend responses

// Mock assets data - EXPANDED TO 50+ ASSETS
const mockAssets = [
  {
    id: "AST-001",
    type: "Ambulance",
    category: "Medical Vehicle",
    capacity: "6 patients",
    status: "Active",
    location: "Central Hospital",
    personnel: "Dr. Sarah Chen",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    condition: "Excellent",
    manufacturer: "Mercedes-Benz",
    model: "Sprinter 316",
    year: "2022",
    fuelType: "Diesel",
    mileage: "45,200",
    value: "$185,000"
  },
  {
    id: "VHL-002",
    type: "Fire Truck",
    category: "Emergency Vehicle",
    capacity: "5000L water",
    status: "Active",
    location: "North Station",
    personnel: "Capt. Mike Rodriguez",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-04-20",
    condition: "Good",
    manufacturer: "Pierce",
    model: "Enforcer",
    year: "2020",
    fuelType: "Diesel",
    mileage: "32,100",
    value: "$650,000"
  },
  {
    id: "EQP-003",
    type: "Generator",
    category: "Power Equipment",
    capacity: "50kW",
    status: "Under Repair",
    location: "Maintenance Depot",
    personnel: "Tech. James Wilson",
    lastMaintenance: "2023-12-10",
    nextMaintenance: "2024-03-10",
    condition: "Poor",
    manufacturer: "Cummins",
    model: "C50D5",
    year: "2019",
    fuelType: "Diesel",
    hours: "2,450",
    value: "$28,500"
  },
  {
    id: "VHL-004",
    type: "Rescue Boat",
    category: "Watercraft",
    capacity: "8 persons",
    status: "Standby",
    location: "Coastal Base",
    personnel: "Lt. Maria Garcia",
    lastMaintenance: "2024-01-05",
    nextMaintenance: "2024-04-05",
    condition: "Good",
    manufacturer: "Zodiac",
    model: "Pro 650",
    year: "2021",
    fuelType: "Gasoline",
    hours: "320",
    value: "$45,000"
  },
  {
    id: "AST-005",
    type: "Mobile Command",
    category: "Communication",
    capacity: "10 operators",
    status: "Active",
    location: "HQ Operations",
    personnel: "Cmdr. Robert Brown",
    lastMaintenance: "2024-01-25",
    nextMaintenance: "2024-04-25",
    condition: "Excellent",
    manufacturer: "Ford",
    model: "F-550 Super Duty",
    year: "2023",
    fuelType: "Diesel",
    mileage: "12,500",
    value: "$320,000"
  },
  {
    id: "EQP-006",
    type: "Water Purifier",
    category: "Water Equipment",
    capacity: "1000L/hour",
    status: "Active",
    location: "Central Hospital",
    personnel: "Tech. Lisa Wang",
    lastMaintenance: "2024-01-18",
    nextMaintenance: "2024-04-18",
    condition: "Good",
    manufacturer: "Katadyn",
    model: "Basecamp X",
    year: "2022",
    power: "Electric",
    value: "$12,500"
  },
  {
    id: "VHL-007",
    type: "ATV",
    category: "All-Terrain Vehicle",
    capacity: "2 persons",
    status: "Under Repair",
    location: "Maintenance Depot",
    personnel: "Tech. Tom Harris",
    lastMaintenance: "2023-11-30",
    nextMaintenance: "2024-02-28",
    condition: "Poor",
    manufacturer: "Polaris",
    model: "Sportsman 850",
    year: "2021",
    fuelType: "Gasoline",
    mileage: "8,200",
    value: "$15,000"
  },
  {
    id: "AST-008",
    type: "Field Hospital",
    category: "Medical Facility",
    capacity: "20 beds",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Dr. Amanda Lee",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-04-10",
    condition: "Excellent",
    manufacturer: "HDT Global",
    model: "Expeditionary",
    year: "2023",
    setupTime: "45 min",
    value: "$1,200,000"
  },
  // Additional Medical Vehicles
  {
    id: "AST-009",
    type: "Ambulance",
    category: "Medical Vehicle",
    capacity: "4 patients",
    status: "Active",
    location: "West Medical Center",
    personnel: "EMT David Kim",
    lastMaintenance: "2024-02-01",
    nextMaintenance: "2024-05-01",
    condition: "Good",
    manufacturer: "Ford",
    model: "Transit 350",
    year: "2021",
    fuelType: "Gasoline",
    mileage: "68,300",
    value: "$120,000"
  },
  {
    id: "AST-010",
    type: "Mobile ICU",
    category: "Medical Vehicle",
    capacity: "2 critical patients",
    status: "Active",
    location: "Central Hospital",
    personnel: "Dr. Emily Carter",
    lastMaintenance: "2024-01-30",
    nextMaintenance: "2024-04-30",
    condition: "Excellent",
    manufacturer: "Mercedes-Benz",
    model: "Sprinter 319",
    year: "2023",
    fuelType: "Diesel",
    mileage: "8,900",
    value: "$350,000"
  },
  {
    id: "AST-011",
    type: "Medical Supply Van",
    category: "Medical Vehicle",
    capacity: "3,000 kg",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Logistics Manager",
    lastMaintenance: "2024-02-05",
    nextMaintenance: "2024-05-05",
    condition: "Good",
    manufacturer: "Ford",
    model: "E-350",
    year: "2020",
    fuelType: "Gasoline",
    mileage: "42,100",
    value: "$85,000"
  },
  // Additional Emergency Vehicles
  {
    id: "VHL-012",
    type: "Fire Engine",
    category: "Emergency Vehicle",
    capacity: "3000L water",
    status: "Active",
    location: "South Station",
    personnel: "Lt. Carlos Mendez",
    lastMaintenance: "2024-02-10",
    nextMaintenance: "2024-05-10",
    condition: "Good",
    manufacturer: "Spartan",
    model: "Gladiator",
    year: "2019",
    fuelType: "Diesel",
    mileage: "28,400",
    value: "$550,000"
  },
  {
    id: "VHL-013",
    type: "Rescue Truck",
    category: "Emergency Vehicle",
    capacity: "6 rescuers",
    status: "Active",
    location: "East Station",
    personnel: "Capt. Jennifer Walsh",
    lastMaintenance: "2024-02-08",
    nextMaintenance: "2024-05-08",
    condition: "Excellent",
    manufacturer: "International",
    model: "7400",
    year: "2022",
    fuelType: "Diesel",
    mileage: "15,200",
    value: "$280,000"
  },
  {
    id: "VHL-014",
    type: "Hazmat Unit",
    category: "Emergency Vehicle",
    capacity: "4 specialists",
    status: "Standby",
    location: "HQ Operations",
    personnel: "Sgt. Mark Thompson",
    lastMaintenance: "2024-01-28",
    nextMaintenance: "2024-04-28",
    condition: "Good",
    manufacturer: "Freightliner",
    model: "M2 106",
    year: "2021",
    fuelType: "Diesel",
    mileage: "22,800",
    value: "$420,000"
  },
  // Power Equipment
  {
    id: "EQP-015",
    type: "Generator",
    category: "Power Equipment",
    capacity: "25kW",
    status: "Active",
    location: "West Medical Center",
    personnel: "Tech. Kevin Patel",
    lastMaintenance: "2024-02-12",
    nextMaintenance: "2024-05-12",
    condition: "Good",
    manufacturer: "Honda",
    model: "EB10000",
    year: "2022",
    fuelType: "Gasoline",
    hours: "1,200",
    value: "$12,000"
  },
  {
    id: "EQP-016",
    type: "Generator",
    category: "Power Equipment",
    capacity: "100kW",
    status: "Active",
    location: "Central Hospital",
    personnel: "Tech. James Wilson",
    lastMaintenance: "2024-01-22",
    nextMaintenance: "2024-04-22",
    condition: "Excellent",
    manufacturer: "Caterpillar",
    model: "C100",
    year: "2020",
    fuelType: "Diesel",
    hours: "3,100",
    value: "$85,000"
  },
  {
    id: "EQP-017",
    type: "Power Distribution",
    category: "Power Equipment",
    capacity: "200A",
    status: "Under Repair",
    location: "Maintenance Depot",
    personnel: "Tech. Lisa Wang",
    lastMaintenance: "2023-12-15",
    nextMaintenance: "2024-03-15",
    condition: "Poor",
    manufacturer: "GE",
    model: "PDU-200",
    year: "2018",
    power: "Electric",
    value: "$18,000"
  },
  // Watercraft
  {
    id: "VHL-018",
    type: "Rescue Boat",
    category: "Watercraft",
    capacity: "6 persons",
    status: "Active",
    location: "River Station",
    personnel: "Lt. Anna Kowalski",
    lastMaintenance: "2024-02-14",
    nextMaintenance: "2024-05-14",
    condition: "Good",
    manufacturer: "Boston Whaler",
    model: "270 Dauntless",
    year: "2022",
    fuelType: "Gasoline",
    hours: "450",
    value: "$95,000"
  },
  {
    id: "VHL-019",
    type: "Patrol Boat",
    category: "Watercraft",
    capacity: "4 persons",
    status: "Standby",
    location: "Coastal Base",
    personnel: "Officer Ben Carter",
    lastMaintenance: "2024-01-29",
    nextMaintenance: "2024-04-29",
    condition: "Good",
    manufacturer: "SeaArk",
    model: "Protector",
    year: "2021",
    fuelType: "Diesel",
    hours: "680",
    value: "$120,000"
  },
  // Communications Equipment
  {
    id: "AST-020",
    type: "Satellite Trailer",
    category: "Communication",
    capacity: "8 operators",
    status: "Active",
    location: "HQ Operations",
    personnel: "Comms Specialist",
    lastMaintenance: "2024-02-03",
    nextMaintenance: "2024-05-03",
    condition: "Excellent",
    manufacturer: "General Dynamics",
    model: "SATCOM-M",
    year: "2023",
    power: "Generator",
    value: "$450,000"
  },
  {
    id: "EQP-021",
    type: "Radio Repeater",
    category: "Communication",
    capacity: "50 mile range",
    status: "Active",
    location: "North Tower",
    personnel: "Tech. Sarah Johnson",
    lastMaintenance: "2024-02-07",
    nextMaintenance: "2024-05-07",
    condition: "Good",
    manufacturer: "Motorola",
    model: "RDU4000",
    year: "2022",
    power: "Solar/Battery",
    value: "$35,000"
  },
  // Additional All-Terrain Vehicles
  {
    id: "VHL-022",
    type: "ATV",
    category: "All-Terrain Vehicle",
    capacity: "2 persons",
    status: "Active",
    location: "Mountain Base",
    personnel: "Ranger Alex Chen",
    lastMaintenance: "2024-02-09",
    nextMaintenance: "2024-05-09",
    condition: "Good",
    manufacturer: "Can-Am",
    model: "Outlander MAX",
    year: "2023",
    fuelType: "Gasoline",
    mileage: "1,200",
    value: "$18,000"
  },
  {
    id: "VHL-023",
    type: "UTV",
    category: "All-Terrain Vehicle",
    capacity: "4 persons",
    status: "Active",
    location: "Forest Station",
    personnel: "Ranger Maria Lopez",
    lastMaintenance: "2024-02-11",
    nextMaintenance: "2024-05-11",
    condition: "Excellent",
    manufacturer: "Polaris",
    model: "Ranger XP 1000",
    year: "2023",
    fuelType: "Gasoline",
    mileage: "800",
    value: "$25,000"
  },
  // Water Equipment
  {
    id: "EQP-024",
    type: "Water Purifier",
    category: "Water Equipment",
    capacity: "500L/hour",
    status: "Active",
    location: "Field Camp Alpha",
    personnel: "Tech. Ryan Brooks",
    lastMaintenance: "2024-02-06",
    nextMaintenance: "2024-05-06",
    condition: "Good",
    manufacturer: "MSR",
    model: "Community Base",
    year: "2022",
    power: "Manual",
    value: "$8,500"
  },
  {
    id: "EQP-025",
    type: "Water Tanker",
    category: "Water Equipment",
    capacity: "10,000L",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Operator Chris Evans",
    lastMaintenance: "2024-01-31",
    nextMaintenance: "2024-04-30",
    condition: "Good",
    manufacturer: "International",
    model: "DuraStar",
    year: "2020",
    fuelType: "Diesel",
    mileage: "38,900",
    value: "$180,000"
  },
  // Medical Equipment
  {
    id: "EQP-026",
    type: "Portable Ventilator",
    category: "Medical Equipment",
    capacity: "1 patient",
    status: "Active",
    location: "Central Hospital",
    personnel: "Respiratory Therapist",
    lastMaintenance: "2024-02-13",
    nextMaintenance: "2024-05-13",
    condition: "Excellent",
    manufacturer: "Draeger",
    model: "Oxylog 3000",
    year: "2023",
    power: "Battery",
    value: "$15,000"
  },
  {
    id: "EQP-027",
    type: "Defibrillator",
    category: "Medical Equipment",
    capacity: "Portable",
    status: "Active",
    location: "All Ambulances",
    personnel: "EMT Staff",
    lastMaintenance: "2024-02-04",
    nextMaintenance: "2024-05-04",
    condition: "Good",
    manufacturer: "ZOLL",
    model: "X Series",
    year: "2022",
    power: "Battery",
    value: "$28,000"
  },
  // Add more to reach 50+...
  {
    id: "AST-028",
    type: "Mobile Kitchen",
    category: "Support Vehicle",
    capacity: "500 meals/day",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Chef Manager",
    lastMaintenance: "2024-01-27",
    nextMaintenance: "2024-04-27",
    condition: "Good",
    manufacturer: "Volvo",
    model: "FL280",
    year: "2021",
    fuelType: "Diesel",
    mileage: "25,600",
    value: "$320,000"
  },
  {
    id: "VHL-029",
    type: "Fuel Truck",
    category: "Support Vehicle",
    capacity: "8,000L",
    status: "Active",
    location: "HQ Operations",
    personnel: "Fuel Specialist",
    lastMaintenance: "2024-02-15",
    nextMaintenance: "2024-05-15",
    condition: "Good",
    manufacturer: "Kenworth",
    model: "T880",
    year: "2020",
    fuelType: "Diesel",
    mileage: "52,300",
    value: "$280,000"
  },
  {
    id: "EQP-030",
    type: "Light Tower",
    category: "Support Equipment",
    capacity: "4x1000W LED",
    status: "Active",
    location: "Event Site Bravo",
    personnel: "Setup Crew",
    lastMaintenance: "2024-02-02",
    nextMaintenance: "2024-05-02",
    condition: "Excellent",
    manufacturer: "Allmand",
    model: "Maxi-Lite",
    year: "2023",
    power: "Generator",
    value: "$12,000"
  },
  // Continue adding more assets...
  {
    id: "AST-031",
    type: "Decontamination Unit",
    category: "Medical Facility",
    capacity: "4 stations",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Hazmat Team",
    lastMaintenance: "2024-01-26",
    nextMaintenance: "2024-04-26",
    condition: "Good",
    manufacturer: "HDT Global",
    model: "Decon-System",
    year: "2022",
    setupTime: "30 min",
    value: "$150,000"
  },
  {
    id: "VHL-032",
    type: "Ambulance Bus",
    category: "Medical Vehicle",
    capacity: "12 patients",
    status: "Active",
    location: "Regional Center",
    personnel: "EMT Supervisor",
    lastMaintenance: "2024-02-16",
    nextMaintenance: "2024-05-16",
    condition: "Excellent",
    manufacturer: "Prevost",
    model: "H3-45",
    year: "2023",
    fuelType: "Diesel",
    mileage: "7,800",
    value: "$550,000"
  },
  {
    id: "EQP-033",
    type: "Air Compressor",
    category: "Support Equipment",
    capacity: "185 CFM",
    status: "Under Repair",
    location: "Maintenance Depot",
    personnel: "Tech. James Wilson",
    lastMaintenance: "2023-12-20",
    nextMaintenance: "2024-03-20",
    condition: "Poor",
    manufacturer: "Ingersoll Rand",
    model: "XP185",
    year: "2019",
    power: "Diesel",
    hours: "2,800",
    value: "$22,000"
  },
  {
    id: "AST-034",
    type: "Mobile Laboratory",
    category: "Medical Facility",
    capacity: "6 technicians",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Lab Director",
    lastMaintenance: "2024-01-24",
    nextMaintenance: "2024-04-24",
    condition: "Excellent",
    manufacturer: "LabTech",
    model: "Mobile-Lab-40",
    year: "2023",
    setupTime: "60 min",
    value: "$850,000"
  },
  {
    id: "VHL-035",
    type: "Search & Rescue Truck",
    category: "Emergency Vehicle",
    capacity: "8 rescuers",
    status: "Active",
    location: "Mountain Base",
    personnel: "SAR Team Lead",
    lastMaintenance: "2024-02-17",
    nextMaintenance: "2024-05-17",
    condition: "Good",
    manufacturer: "Ford",
    model: "F-550",
    year: "2022",
    fuelType: "Diesel",
    mileage: "18,400",
    value: "$195,000"
  },
  {
    id: "EQP-036",
    type: "Thermal Camera",
    category: "Search Equipment",
    capacity: "Portable",
    status: "Active",
    location: "All Rescue Units",
    personnel: "SAR Technician",
    lastMaintenance: "2024-02-18",
    nextMaintenance: "2024-05-18",
    condition: "Excellent",
    manufacturer: "FLIR",
    model: "K65",
    year: "2023",
    power: "Battery",
    value: "$15,000"
  },
  {
    id: "AST-037",
    type: "Command Trailer",
    category: "Communication",
    capacity: "12 operators",
    status: "Active",
    location: "Incident Site Charlie",
    personnel: "Incident Commander",
    lastMaintenance: "2024-02-19",
    nextMaintenance: "2024-05-19",
    condition: "Good",
    manufacturer: "Will-Burt",
    model: "Command-12",
    year: "2021",
    setupTime: "20 min",
    value: "$380,000"
  },
  {
    id: "VHL-038",
    type: "Helicopter",
    category: "Aircraft",
    capacity: "6 persons",
    status: "Active",
    location: "Air Operations",
    personnel: "Pilot Chris Mitchell",
    lastMaintenance: "2024-02-20",
    nextMaintenance: "2024-05-20",
    condition: "Excellent",
    manufacturer: "Bell",
    model: "412",
    year: "2022",
    fuelType: "Jet A",
    hours: "450",
    value: "$8,500,000"
  },
  {
    id: "EQP-039",
    type: "Drone",
    category: "Aircraft",
    capacity: "5kg payload",
    status: "Active",
    location: "Air Operations",
    personnel: "UAV Operator",
    lastMaintenance: "2024-02-21",
    nextMaintenance: "2024-05-21",
    condition: "Good",
    manufacturer: "DJI",
    model: "Matrice 350",
    year: "2023",
    power: "Battery",
    flightTime: "55 min",
    value: "$25,000"
  },
  {
    id: "AST-040",
    type: "Mobile Workshop",
    category: "Support Vehicle",
    capacity: "4 technicians",
    status: "Active",
    location: "Field Operations",
    personnel: "Lead Technician",
    lastMaintenance: "2024-02-22",
    nextMaintenance: "2024-05-22",
    condition: "Good",
    manufacturer: "Freightliner",
    model: "M2-106",
    year: "2021",
    fuelType: "Diesel",
    mileage: "34,200",
    value: "$220,000"
  },
  // Continue to 50...
  {
    id: "VHL-041",
    type: "Patient Transport",
    category: "Medical Vehicle",
    capacity: "3 wheelchair",
    status: "Active",
    location: "Central Hospital",
    personnel: "Transport Coordinator",
    lastMaintenance: "2024-02-23",
    nextMaintenance: "2024-05-23",
    condition: "Good",
    manufacturer: "Braun",
    model: "Entervan",
    year: "2022",
    fuelType: "Gasoline",
    mileage: "29,800",
    value: "$65,000"
  },
  {
    id: "EQP-042",
    type: "Oxygen Concentrator",
    category: "Medical Equipment",
    capacity: "10L/min",
    status: "Active",
    location: "All Medical Units",
    personnel: "Medical Staff",
    lastMaintenance: "2024-02-24",
    nextMaintenance: "2024-05-24",
    condition: "Excellent",
    manufacturer: "Philips",
    model: "SimplyGo",
    year: "2023",
    power: "Battery/AC",
    value: "$2,800"
  },
  {
    id: "AST-043",
    type: "Shelter System",
    category: "Support Facility",
    capacity: "50 persons",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Setup Team",
    lastMaintenance: "2024-01-23",
    nextMaintenance: "2024-04-23",
    condition: "Good",
    manufacturer: "Weatherhaven",
    model: "Expandable-50",
    year: "2022",
    setupTime: "45 min",
    value: "$120,000"
  },
  {
    id: "VHL-044",
    type: "Utility Truck",
    category: "Support Vehicle",
    capacity: "2,000 kg",
    status: "Active",
    location: "HQ Operations",
    personnel: "Facilities Manager",
    lastMaintenance: "2024-02-25",
    nextMaintenance: "2024-05-25",
    condition: "Good",
    manufacturer: "Chevrolet",
    model: "Silverado 3500",
    year: "2023",
    fuelType: "Diesel",
    mileage: "8,900",
    value: "$75,000"
  },
  {
    id: "EQP-045",
    type: "Water Pump",
    category: "Water Equipment",
    capacity: "3000L/min",
    status: "Under Repair",
    location: "Maintenance Depot",
    personnel: "Tech. Tom Harris",
    lastMaintenance: "2023-12-25",
    nextMaintenance: "2024-03-25",
    condition: "Poor",
    manufacturer: "Honda",
    model: "WT40",
    year: "2020",
    fuelType: "Gasoline",
    hours: "1,800",
    value: "$3,500"
  },
  {
    id: "AST-046",
    type: "Mobile Morgue",
    category: "Medical Facility",
    capacity: "12 remains",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Forensic Director",
    lastMaintenance: "2024-01-21",
    nextMaintenance: "2024-04-21",
    condition: "Excellent",
    manufacturer: "Mopec",
    model: "Mobile-Morgue-12",
    year: "2023",
    power: "Generator",
    value: "$280,000"
  },
  {
    id: "VHL-047",
    type: "Incident Response",
    category: "Emergency Vehicle",
    capacity: "6 responders",
    status: "Active",
    location: "Regional Center",
    personnel: "Response Team Lead",
    lastMaintenance: "2024-02-26",
    nextMaintenance: "2024-05-26",
    condition: "Good",
    manufacturer: "Ford",
    model: "F-450",
    year: "2022",
    fuelType: "Diesel",
    mileage: "22,100",
    value: "$165,000"
  },
  {
    id: "EQP-048",
    type: "Gas Detector",
    category: "Safety Equipment",
    capacity: "4-gas monitor",
    status: "Active",
    location: "All Response Units",
    personnel: "Safety Officer",
    lastMaintenance: "2024-02-27",
    nextMaintenance: "2024-05-27",
    condition: "Excellent",
    manufacturer: "MSA",
    model: "Altair 5X",
    year: "2023",
    power: "Battery",
    value: "$3,200"
  },
  {
    id: "AST-049",
    type: "Mobile Pharmacy",
    category: "Medical Facility",
    capacity: "500 medications",
    status: "Standby",
    location: "Storage Warehouse",
    personnel: "Pharmacist",
    lastMaintenance: "2024-01-19",
    nextMaintenance: "2024-04-19",
    condition: "Good",
    manufacturer: "Custom Built",
    model: "Pharma-Mobile-500",
    year: "2022",
    temperature: "Controlled",
    value: "$180,000"
  },
  {
    id: "VHL-050",
    type: "Ambulance",
    category: "Medical Vehicle",
    capacity: "5 patients",
    status: "Active",
    location: "South Medical Center",
    personnel: "EMT Jessica Brown",
    lastMaintenance: "2024-02-28",
    nextMaintenance: "2024-05-28",
    condition: "Good",
    manufacturer: "Mercedes-Benz",
    model: "Sprinter 314",
    year: "2021",
    fuelType: "Diesel",
    mileage: "52,400",
    value: "$160,000"
  }
];

const mockMetrics = {
  total_assets: 50,
  active_assets: 42,
  vehicles_under_repair: 5,
  assets_unassigned: 3,
  total_value: "$15,845,300",
  maintenance_cost_ytd: "$285,400",
  utilization_rate: "84%",
  uptime_percentage: "92%"
};

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAssetService = {
  async getAssets() {
    await delay(800);
    return [...mockAssets];
  },

  async getMetrics() {
    await delay(500);
    return { ...mockMetrics };
  },

  async getTransactionsByDate(date) {
    await delay(600);
    return {
      data: [
        {
          assetId: "AST-001",
          type: "maintenance",
          description: "Routine service completed",
          personnel: "Tech. James Wilson",
          location: "Maintenance Depot",
          timestamp: `${date}T10:30:00Z`
        },
        {
          assetId: "VHL-002",
          type: "inspection",
          description: "Monthly safety inspection",
          personnel: "Safety Officer",
          location: "North Station",
          timestamp: `${date}T14:15:00Z`
        },
        {
          assetId: "EQP-003",
          type: "repair",
          description: "Generator engine overhaul",
          personnel: "Tech. James Wilson",
          location: "Maintenance Depot",
          timestamp: `${date}T16:45:00Z`
        }
      ]
    };
  },

  async createAsset(assetData) {
    await delay(1000);
    const newAsset = {
      ...assetData,
      id: `AST-${String(mockAssets.length + 1).padStart(3, '0')}`,
      condition: "New"
    };
    mockAssets.push(newAsset);
    return newAsset;
  },

  async updateAsset(id, assetData) {
    await delay(800);
    const index = mockAssets.findIndex(asset => asset.id === id);
    if (index !== -1) {
      mockAssets[index] = { ...mockAssets[index], ...assetData };
      return mockAssets[index];
    }
    throw new Error("Asset not found");
  },

  async deleteAsset(id) {
    await delay(600);
    const index = mockAssets.findIndex(asset => asset.id === id);
    if (index !== -1) {
      return mockAssets.splice(index, 1)[0];
    }
    throw new Error("Asset not found");
  },

  // MAINTENANCE METHODS
  async getMaintenanceData() {
    await delay(600);
    return {
      upcoming: [
        {
          id: 1,
          assetId: "AST-001",
          scheduledDate: "2024-02-15",
          description: "Routine service and inspection",
          status: "scheduled",
          priority: "high"
        },
        {
          id: 2,
          assetId: "VHL-002",
          scheduledDate: "2024-02-20", 
          description: "Engine maintenance",
          status: "scheduled",
          priority: "medium"
        },
        {
          id: 6,
          assetId: "EQP-006",
          scheduledDate: "2024-02-25",
          description: "Filter replacement",
          status: "scheduled",
          priority: "low"
        },
        {
          id: 10,
          assetId: "AST-010",
          scheduledDate: "2024-02-28",
          description: "ICU equipment calibration",
          status: "scheduled",
          priority: "high"
        },
        {
          id: 15,
          assetId: "EQP-015",
          scheduledDate: "2024-03-01",
          description: "Generator service",
          status: "scheduled",
          priority: "medium"
        },
        {
          id: 22,
          assetId: "VHL-022",
          scheduledDate: "2024-03-05",
          description: "ATV tire replacement",
          status: "scheduled",
          priority: "low"
        }
      ],
      overdue: [
        {
          id: 3,
          assetId: "EQP-003",
          scheduledDate: "2024-01-30",
          description: "Generator repair",
          status: "overdue",
          priority: "high"
        },
        {
          id: 7,
          assetId: "VHL-007",
          scheduledDate: "2024-01-15",
          description: "Transmission repair",
          status: "overdue",
          priority: "high"
        },
        {
          id: 17,
          assetId: "EQP-017",
          scheduledDate: "2024-02-10",
          description: "Power distribution repair",
          status: "overdue",
          priority: "high"
        },
        {
          id: 33,
          assetId: "EQP-033",
          scheduledDate: "2024-02-05",
          description: "Air compressor overhaul",
          status: "overdue",
          priority: "medium"
        },
        {
          id: 45,
          assetId: "EQP-045",
          scheduledDate: "2024-02-12",
          description: "Water pump repair",
          status: "overdue",
          priority: "medium"
        }
      ],
      completed: [
        {
          id: 4,
          assetId: "VHL-004",
          completedDate: "2024-02-05",
          description: "Hull inspection and cleaning",
          status: "completed",
          technician: "Tech. James Wilson",
          cost: 450
        },
        {
          id: 5,
          assetId: "AST-005", 
          completedDate: "2024-02-01",
          description: "Communication system update",
          status: "completed",
          technician: "Tech. Maria Garcia",
          cost: 1200
        },
        {
          id: 8,
          assetId: "AST-008",
          completedDate: "2024-01-28",
          description: "Tent inspection and repair",
          status: "completed",
          technician: "Tech. Tom Harris",
          cost: 320
        },
        {
          id: 12,
          assetId: "VHL-012",
          completedDate: "2024-02-08",
          description: "Pump testing",
          status: "completed",
          technician: "Tech. Kevin Patel",
          cost: 850
        },
        {
          id: 19,
          assetId: "VHL-019",
          completedDate: "2024-02-03",
          description: "Engine service",
          status: "completed",
          technician: "Tech. Lisa Wang",
          cost: 1200
        },
        {
          id: 26,
          assetId: "EQP-026",
          completedDate: "2024-02-10",
          description: "Ventilator calibration",
          status: "completed",
          technician: "Medical Tech",
          cost: 600
        }
      ]
    };
  },

  async scheduleMaintenance(maintenanceData) {
    await delay(800);
    const newMaintenance = {
      id: `MTN-${Date.now()}`,
      ...maintenanceData,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    console.log('Scheduling maintenance:', newMaintenance);
    return newMaintenance;
  },

  // REPORTS & ANALYTICS METHODS
  async getAnalyticsData(dateRange = "month") {
    await delay(700);
    
    // Mock analytics data based on date range
    const dataByRange = {
      week: { multiplier: 1, period: "weekly" },
      month: { multiplier: 4, period: "monthly" },
      quarter: { multiplier: 12, period: "quarterly" },
      year: { multiplier: 48, period: "yearly" }
    };
    
    const range = dataByRange[dateRange] || dataByRange.month;
    
    return {
      statusDistribution: [
        { status: "Active", count: 42, percentage: 84 },
        { status: "Under Repair", count: 5, percentage: 10 },
        { status: "Standby", count: 3, percentage: 6 }
      ],
      utilizationRates: [
        { label: "Ambulances", value: 88 },
        { label: "Fire Trucks", value: 92 },
        { label: "Generators", value: 65 },
        { label: "Rescue Boats", value: 72 },
        { label: "Command Units", value: 78 },
        { label: "Support Vehicles", value: 85 },
        { label: "Medical Equipment", value: 91 },
        { label: "Aircraft", value: 45 }
      ],
      maintenanceCosts: [
        { label: "Medical Vehicles", value: 18500 },
        { label: "Emergency Vehicles", value: 28700 },
        { label: "Power Equipment", value: 15300 },
        { label: "Watercraft", value: 18200 },
        { label: "Communications", value: 25600 },
        { label: "Aircraft", value: 125000 },
        { label: "Support Equipment", value: 9800 }
      ],
      assetCategories: [
        { category: "Medical Vehicle", count: 12, value: "$2,845,000" },
        { category: "Emergency Vehicle", count: 8, value: "$3,120,000" },
        { category: "Power Equipment", count: 6, value: "$185,000" },
        { category: "Watercraft", count: 3, value: "$260,000" },
        { category: "Communication", count: 4, value: "$1,265,000" },
        { category: "Aircraft", count: 2, value: "$8,525,000" },
        { category: "Support Vehicle", count: 8, value: "$1,240,000" },
        { category: "Medical Equipment", count: 4, value: "$61,800" },
        { category: "Support Equipment", count: 3, value: "$33,500" }
      ],
      assetMetrics: {
        totalAssets: "50",
        utilizationRate: "84%",
        avgMaintenanceCost: "$1,450",
        uptime: "92%",
        maintenanceBacklog: "5",
        costSavings: "$8,200",
        totalValue: "$15.8M",
        activePersonnel: "68"
      }
    };
  },

  // EXPORT & REPORT METHODS
  async generateReport(exportConfig) {
    console.log('Generating report with config:', exportConfig);
    
    // Simulate API delay
    await delay(1500);
    
    // Simulate file download
    const content = `Asset Registry Report\nGenerated: ${new Date().toLocaleDateString()}\nFormat: ${exportConfig.format}\nType: ${exportConfig.reportType}\nDate Range: ${exportConfig.dateRange}\nTotal Assets: 50\nActive Assets: 42\nTotal Value: $15.8M`;
    const blob = new Blob([content], { 
      type: exportConfig.format === 'pdf' ? 'application/pdf' : 
            exportConfig.format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-report-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      format: exportConfig.format,
      reportType: exportConfig.reportType,
      generatedAt: new Date().toISOString()
    };
  },

  async getReportTemplates() {
    await delay(500);
    return [
      {
        id: 'asset-summary',
        name: 'Asset Summary Report',
        description: 'Overview of all assets and status',
        category: 'summary',
        icon: '📊',
        popularity: 95
      },
      {
        id: 'maintenance-report',
        name: 'Maintenance Report',
        description: 'Maintenance history and schedules',
        category: 'maintenance',
        icon: '🔧',
        popularity: 88
      },
      {
        id: 'utilization-report',
        name: 'Utilization Report',
        description: 'Asset usage and performance metrics',
        category: 'performance',
        icon: '📈',
        popularity: 92
      },
      {
        id: 'cost-analysis',
        name: 'Cost Analysis',
        description: 'Maintenance and operational costs',
        category: 'financial',
        icon: '💰',
        popularity: 85
      },
      {
        id: 'inventory-report',
        name: 'Inventory Report',
        description: 'Complete asset inventory listing',
        category: 'summary',
        icon: '📋',
        popularity: 78
      },
      {
        id: 'performance-dashboard',
        name: 'Performance Dashboard',
        description: 'Key performance indicators',
        category: 'performance',
        icon: '🚀',
        popularity: 90
      }
    ];
  },

  async exportData(format, data) {
    await delay(1000);
    console.log(`Exporting data as ${format}:`, data);
    return { 
      success: true, 
      format, 
      timestamp: new Date().toISOString(),
      message: `Data exported successfully as ${format}`
    };
  },

  // ADDITIONAL UTILITY METHODS
  async searchAssets(query) {
    await delay(600);
    const filteredAssets = mockAssets.filter(asset => 
      asset.id.toLowerCase().includes(query.toLowerCase()) ||
      asset.type.toLowerCase().includes(query.toLowerCase()) ||
      asset.location.toLowerCase().includes(query.toLowerCase()) ||
      asset.personnel.toLowerCase().includes(query.toLowerCase()) ||
      asset.category.toLowerCase().includes(query.toLowerCase()) ||
      asset.manufacturer.toLowerCase().includes(query.toLowerCase())
    );
    return filteredAssets;
  },

  async getAssetsByStatus(status) {
    await delay(500);
    const filteredAssets = mockAssets.filter(asset => asset.status === status);
    return filteredAssets;
  },

  async getAssetsByLocation(location) {
    await delay(500);
    const filteredAssets = mockAssets.filter(asset => asset.location === location);
    return filteredAssets;
  },

  async getAssetsByCategory(category) {
    await delay(500);
    const filteredAssets = mockAssets.filter(asset => asset.category === category);
    return filteredAssets;
  },

  async getAssetCategories() {
    await delay(300);
    const categories = [...new Set(mockAssets.map(asset => asset.category))];
    return categories;
  },

  async getAssetLocations() {
    await delay(300);
    const locations = [...new Set(mockAssets.map(asset => asset.location))];
    return locations;
  }
};

export default mockAssetService;