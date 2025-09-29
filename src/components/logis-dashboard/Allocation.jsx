import { useState, useEffect } from "react";

const mockRequests = [
  {
    id: "R-1001",
    location: "Barangay San Jose",
    urgency: "Critical",
    type: "Medical",
    time: "2025-09-27T15:30:00Z",
    contact: "Field Team 4 (0917xxxxxxx)",
    justification:
      "Immediate need for pediatric pain relief and antibiotics due to rising infection rates in shelter.",
    items: [
      { name: "Pediatric Pain Reliever", qty: 150 },
      { name: "Broad Spectrum Antibiotics", qty: 75 },
      { name: "Bandages", qty: 500 },
    ],
  },
  {
    id: "R-1002",
    location: "Evacuation Center 3",
    urgency: "High",
    type: "Shelter",
    time: "2025-09-27T14:55:00Z",
    contact: "Center Manager (0998xxxxxxx)",
    justification:
      "We urgently require additional large tarps and ropes before the next wave of rain hits tonight.",
    items: [
      { name: "Large Tarpaulin (10x10m)", qty: 30 },
      { name: "Rope (200m spool)", qty: 5 },
    ],
  },
];

const urgencyClasses = {
  Critical: "bg-red-500 text-white urgent-pulse",
  High: "bg-yellow-300 text-yellow-900",
  Medium: "bg-blue-500 text-white",
  Low: "bg-green-500 text-white",
};

export function Allocation () {
  const [requests, setRequests] = useState(mockRequests);
  const [selected, setSelected] = useState(mockRequests[0]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    // later replace 
    setRequests(mockRequests);
  }, []);

  const filteredRequests = requests.filter(
    (r) =>
      r.location.toLowerCase().includes(filter.toLowerCase()) ||
      r.type.toLowerCase().includes(filter.toLowerCase()) ||
      r.items.some((i) =>
        i.name.toLowerCase().includes(filter.toLowerCase())
      )
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-center p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Requested Allocation Management
        </h1>
        <button className="mt-3 md:mt-0 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg transition flex items-center">
          Allocation History
        </button>
      </header>

      {/* MAIN */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Request Queue */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-lg h-[80vh] flex flex-col">
          <h2 className="text-xl font-bold text-gray-700 p-4 border-b">
            Request Queue <span className="text-highlight">({filteredRequests.length} Pending)</span>
          </h2>
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Filter by barangay or item..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="text-left flex-grow overflow-y-auto divide-y divide-gray-200">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelected(req)}
                className={`p-4 cursor-pointer transition ${
                  selected?.id === req.id
                    ? "bg-gray-200 border-l-4 border-primary"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-gray-800">
                    {req.location}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${urgencyClasses[req.urgency]}`}
                  >
                    {req.urgency}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {req.items.map((i) => i.name).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Decision Panel */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 h-[80vh] flex flex-col">
          {selected ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                {selected.location} ({selected.id})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Request Details
                  </h3>
                  <p className="text-left">
                    <strong>From:</strong> {selected.location}
                  </p>
                  <p className="text-left">
                    <strong>Contact:</strong> {selected.contact}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Items
                  </h3>
                  {selected.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm border-b py-1"
                    >
                      <span>{item.name}</span>
                      <span className="font-bold">{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto border-t pt-4">
                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg">
                    ACCEPT
                  </button>
                  <button className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl shadow-lg">
                    MODIFY
                  </button>
                  <button className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg">
                    REJECT
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 mt-20">
              Select a request to review
            </p>
          )}
        </section>
      </main>
    </div>
  );
};

