import { useState, useEffect } from "react";
import { List, Plus, Send, Check, X, ArrowRightLeft, Ambulance, HeartHandshake, Package, PackageOpen, PackageCheck, Truck, Clock, Droplets, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import api from "../../services/api"; // <-- Make sure this path is correct

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X size={24} className="text-primary" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
// --- END: Modal Component ---


// --- Main Allocation Component (Tab Switcher) ---
export function Allocation() {
  const [activeTab, setActiveTab] = useState("incoming");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background min-h-screen">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-center p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          Requested Allocation
        </h1>
        <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="mt-3 md:mt-0 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold py-2 px-4 rounded-lg transition flex items-center"
        >
          Allocation History
        </button>
      </header>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b-2 border-gray-200">
        <TabButton
          label="Incoming Requests"
          isActive={activeTab === "incoming"}
          onClick={() => setActiveTab("incoming")}
        />
        <TabButton
          label="Track My Requests"
          isActive={activeTab === "track"}
          onClick={() => setActiveTab("track")}
        />
      </div>

      {/* Tab Content */}
      <main>
        {activeTab === "incoming" && <IncomingRequestsPanel />}
        {activeTab === "track" && <OutgoingRequestsPanel />}
      </main>

      {/* --- Allocation History Modal --- */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Allocation History"
      >
        <AllocationHistoryPanel />
      </Modal>
    </div>
  );
}


// --- Tab Button Component ---
const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-semibold border-b-4 transition-all duration-200 ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-800'
    }`}
  >
    {label}
  </button>
);

// --- 1. Panel for "Incoming Requests" ---
const urgencyClasses = {
  Critical: "bg-red-500 text-white urgent-pulse",
  High: "bg-yellow-300 text-yellow-900",
  Medium: "bg-blue-500 text-white",
  Low: "bg-green-500 text-white",
};

const STATUS_PROGRESSION = {
  'Pending': ['Approved', 'Cancelled'], 
  'Approved': ['Packed', 'Cancelled'],
  'Packed': ['Shipped', 'Cancelled'],
  'Shipped': ['On-the-Way', 'Cancelled'],
  'On-the-Way': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': [],
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return <Package size={18} className="text-yellow-500" />;
    case 'Approved': return <PackageOpen size={18} className="text-blue-500" />;
    case 'Packed': return <Package size={18} className="text-indigo-500" />;
    case 'Shipped': return <Truck size={18} className="text-cyan-500" />;
    case 'On-the-Way': return <Truck size={18} className="text-cyan-500 animate-pulse" />;
    case 'Delivered': return <PackageCheck size={18} className="text-green-500" />;
    case 'Cancelled': return <X size={18} className="text-red-500" />;
    default: return <Package size={18} className="text-gray-500" />;
  }
};

function IncomingRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [nextStatus, setNextStatus] = useState('Pending');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/incoming-requests');
      setRequests(response.data);
      if (response.data.length > 0) {
        setSelected(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch incoming requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (selected) {
      setNextStatus(STATUS_PROGRESSION[selected.status]?.[0] || selected.status);
    }
  }, [selected]);

  const filteredRequests = requests.filter(
    (r) =>
      (r.source_location && r.source_location.toLowerCase().includes(filter.toLowerCase())) ||
      (r.request_type && r.request_type.toLowerCase().includes(filter.toLowerCase())) ||
      (r.item_name && r.item_name.toLowerCase().includes(filter.toLowerCase()))
  );
  
  // --- MODIFIED: This function now handles removing items from the list ---
  const handleStatusChange = async (newStatus, reason = "") => {
    if (!selected) return;
    try {
      const response = await api.put(`/incoming-requests/${selected.id}/status`, {
        status: newStatus,
        rejection_reason: reason,
      });
      
      const updatedRequest = response.data;
      
      // If the request is now finished (Cancelled or Delivered), remove it from the list
      if (newStatus === 'Cancelled' || newStatus === 'Delivered') {
        const remainingRequests = requests.filter(r => r.id !== updatedRequest.id);
        setRequests(remainingRequests);
        setSelected(remainingRequests.length > 0 ? remainingRequests[0] : null);
      } else {
        // Otherwise, just update the item in the list
        setSelected(updatedRequest);
        setRequests(prevRequests =>
          prevRequests.map(r =>
            r.id === updatedRequest.id ? updatedRequest : r
          )
        );
      }
      
      setNextStatus(updatedRequest.status);
      alert(`Request ${updatedRequest.request_id} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  };

  const handleSubmitRejection = () => {
    if (!rejectReason) {
      alert("Please provide a reason for rejection.");
      return;
    }
    handleStatusChange('Cancelled', rejectReason);
    setIsRejectModalOpen(false);
    setRejectReason("");
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Request Queue */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-lg h-[80vh] flex flex-col">
          <h2 className="text-xl font-bold text-gray-700 p-4 border-b">
            Request Queue <span className="text-primary">({filteredRequests.length})</span>
          </h2>
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Filter by location or item..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="text-left flex-grow overflow-y-auto divide-y divide-gray-200">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-10" /> :
             filteredRequests.length === 0 ? <p className="text-center text-gray-500 p-4">No incoming requests.</p> :
             filteredRequests.map((req) => (
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
                    {req.source_location}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${urgencyClasses[req.urgency]}`}
                  >
                    {req.urgency}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mb-2">
                  {req.item_name} (Qty: {req.item_quantity})
                </p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(req.status)}
                  <span className="text-sm font-semibold">{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Decision Panel */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 h-[80vh] flex flex-col text-left">
          {selected ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                {selected.source_location} ({selected.request_id})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Request Details</h3>
                  <p><strong>From:</strong> {selected.source_location}</p>
                  <p><strong>Contact:</strong> {selected.contact_info}</p>
                  <p><strong>Type:</strong> {selected.request_type}</p>
                  <p><strong>Urgency:</strong> {selected.urgency}</p>
                  <p><strong>Status:</strong> <span className="font-semibold">{selected.status}</span></p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Items</h3>
                  <div className="flex justify-between text-sm border-b py-1">
                    <span>{selected.item_name}</span>
                    <span className="font-bold">{selected.item_quantity}</span>
                  </div>
                </div>
              </div>
               <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Justification</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{selected.justification}</p>
                  {selected.status === 'Cancelled' && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mt-2">
                      <strong>Rejection Reason:</strong> {selected.rejection_reason}
                    </p>
                  )}
              </div>

              {/* --- DYNAMIC ACTION PANEL --- */}
              <div className="mt-auto border-t pt-4">
                {selected.status === 'Pending' && (
                  <div className="flex gap-4">
                    <button onClick={() => handleStatusChange('Approved')} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg">
                      ACCEPT
                    </button>
                    <button onClick={() => setIsRejectModalOpen(true)} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg">
                      REJECT
                    </button>
                  </div>
                )}
                {['Approved', 'Packed', 'Shipped', 'On-the-Way'].includes(selected.status) && (
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label htmlFor="nextStatus" className="block text-sm font-medium text-gray-700">Update Progress</label>
                      <select
                        id="nextStatus"
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value)}
                        className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value={selected.status} disabled>{selected.status} (Current)</option>
                        {STATUS_PROGRESSION[selected.status].map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => handleStatusChange(nextStatus)}
                      className="py-3 px-6 bg-primary hover:bg-green-700 text-white font-bold rounded-xl shadow-lg whitespace-nowrap w-full sm:w-auto"
                    >
                      Update Status
                    </button>
                  </div>
                )}
                {['Delivered', 'Cancelled'].includes(selected.status) && (
                  <p className={`text-center text-lg font-semibold ${selected.status === 'Delivered' ? 'text-green-600' : 'text-red-600'}`}>
                    Request {selected.status}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 mt-20">
              Select a request to review
            </p>
          )}
        </section>
      </div>

      {/* --- Rejection Modal --- */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Request"
      >
        <div className="space-y-4">
          <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 text-left">
            Please provide a reason for rejecting this request (this will be sent to the requester).
          </label>
          <textarea
            id="rejectReason"
            rows="4"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., Insufficient stock, unable to fulfill at this time..."
          ></textarea>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="py-2 px-4 rounded-md font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitRejection}
              className="py-2 px-4 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition"
            >
              Submit Rejection
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// --- 2. Panel for "Create New Request" ---
function CreateRequestPanel({ onClose, onSave }) {
  const [requestType, setRequestType] = useState("resources");
  const [hospital, setHospital] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [hospitals, setHospitals] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        const response = await api.get('/hospitals'); 
        setHospitals(response.data);
      } catch (err) {
        console.error("Failed to fetch hospitals", err);
      } finally {
        setIsLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        destination_hospital: hospital,
        item_name: item,
        item_quantity: quantity,
        request_type: requestType,
        urgency: urgency,
      };
      const response = await api.post('/allocation-requests', payload);
      alert('Request submitted successfully!');
      if (onSave) onSave(response.data);
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to create request", err);
      alert("Failed to submit request. Please check the details.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  let ItemIcon = ArrowRightLeft;
  let itemLabel = "Item";
  let itemPlaceholder = "e.g., PPE, Ventilator, Saline";
  
  if (requestType === 'ambulance') {
    ItemIcon = Ambulance;
    itemLabel = "Reason / Patient Details";
    itemPlaceholder = "e.g., Patient transfer for surgery";
  } else if (requestType === 'blood') {
    ItemIcon = Droplets;
    itemLabel = "Blood Type / Details";
    itemPlaceholder = "e.g., O-Negative, 10 bags";
  } else if (requestType === 'organs') {
    ItemIcon = HeartHandshake;
    itemLabel = "Organ Type";
    itemPlaceholder = "e.g., Kidney, Type A+";
  }

  return (
    <form className="space-y-6 text-left" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="requestType" className="block text-sm font-medium text-gray-700">Request Type</label>
        <select
          id="requestType"
          value={requestType}
          onChange={(e) => { setRequestType(e.target.value); setItem(''); }}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        >
          <option value="resources">Hospital Resources</option>
          <option value="ambulance">Ambulance</option>
          <option value="blood">Blood</option>
          <option value="organs">Organ/Body Part</option>
        </select>
      </div>
      <div>
        <label htmlFor="hospital" className="block text-sm font-medium text-gray-700">Destination Hospital (Near you)</label>
        <select
          id="hospital"
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
          required
          disabled={isLoadingHospitals}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        >
          <option value="" disabled>
            {isLoadingHospitals ? "Loading hospitals..." : "Select a hospital..."}
          </option>
          {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
      </div>
      <FormInput 
        label={itemLabel} 
        value={item} 
        onChange={(e) => setItem(e.target.value)} 
        placeholder={itemPlaceholder} 
        Icon={ItemIcon} 
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            required
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">Urgency</label>
          <select
            id="urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
          Submit Request
        </button>
      </div>
    </form>
  );
}

// --- 3. Panel for "Track My Requests" ---
function OutgoingRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOutgoing = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/outgoing-requests');
      setRequests(response.data);
      if (response.data.length > 0) {
        setSelected(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch outgoing requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoing();
  }, []);

  const handleNewRequestSaved = (newRequest) => {
    // Add new request to the top of the list
    setRequests(prev => [newRequest, ...prev]);
    setSelected(newRequest); // Select the new request
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Package size={18} className="text-yellow-500" />;
      case 'Approved': return <PackageOpen size={18} className="text-blue-500" />;
      case 'Shipped': return <Truck size={18} className="text-cyan-500" />;
      case 'Delivered': return <PackageCheck size={18} className="text-green-500" />;
      default: return <Package size={18} className="text-gray-500" />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Outgoing List */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-lg h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-gray-700">
              Outgoing Requests
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 bg-primary text-white text-xs px-3 py-1 rounded-md hover:bg-green-700 transition"
            >
              <Plus size={16} /> New
            </button>
          </div>
          <div className="text-left flex-grow overflow-y-auto divide-y divide-gray-200">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-10" /> :
             requests.length === 0 ? <p className="text-center text-gray-500 p-4">No outgoing requests found.</p> :
             requests.map((req) => (
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
                  <span className="text-sm font-bold text-gray-800">{req.destination_hospital}</span>
                  <span className="text-xs font-semibold text-gray-600">{req.request_id}</span>
                </div>
                <p className="text-sm text-gray-700">{req.item_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(req.status)}
                  <span className="text-sm font-semibold">{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Tracking Details */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 h-[80vh] flex flex-col text-left">
          {selected ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                Tracking: {selected.request_id}
              </h2>
              <div className="mb-6">
                <p><strong>Item:</strong> {selected.item_name} (Qty: {selected.item_quantity})</p>
                <p><strong>To:</strong> {selected.destination_hospital}</p>
                <p><strong>Current Status:</strong> <span className="font-bold text-primary">{selected.status}</span></p>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Tracking History</h3>
              <div className="relative pl-6 space-y-6">
                {selected.tracking_history && selected.tracking_history.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-5 top-1 flex items-center justify-center w-10 h-10 rounded-full ${
                      idx === (selected.tracking_history.length - 1) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx === (selected.tracking_history.length - 1) ? getStatusIcon(selected.status) : <Clock size={18} />}
                    </div>
                    <div className="ml-8">
                      <p className="font-semibold text-primary">{step.status}</p>
                      <p className="text-sm text-gray-600">{step.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(step.time), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 mt-20">
              Select a request to view its tracking details.
            </p>
          )}
        </section>
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Allocation Request"
      >
        <CreateRequestPanel 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleNewRequestSaved} 
        />
      </Modal>
    </>
  );
}

// --- NEW: Allocation History Panel ---
function AllocationHistoryPanel() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/allocation-history');
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-4">
      {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-10" /> :
       history.length > 0 ? history.map(req => (
        <div key={req.id} className={`p-4 rounded-lg border-l-4 ${req.status === 'Delivered' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-primary">{req.source_location} (to {req.destination_hospital})</span>
            <span className={`font-semibold text-sm ${req.status === 'Delivered' ? 'text-green-600' : 'text-red-600'}`}>{req.status}</span>
          </div>
          <p className="text-sm text-gray-500 text-left">{formatDistanceToNow(new Date(req.updated_at), { addSuffix: true })}</p>
          <div className="mt-2 text-sm text-left">
            <p className="font-semibold">Item:</p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>{req.item_name} (Qty: {req.item_quantity})</li>
            </ul>
          </div>
          {req.status === 'Cancelled' && req.rejection_reason && (
            <div className="mt-2 text-sm text-left">
              <p className="font-semibold text-red-700">Reason for Rejection:</p>
              <p className="text-gray-700 italic">"{req.rejection_reason}"</p>
            </div>
          )}
        </div>
      )) : (
        <p className="text-center text-gray-500">No history found.</p>
      )}
    </div>
  );
}


// --- Reusable Form Input Component ---
const FormInput = ({ label, value, onChange, placeholder = "", Icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
      {Icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className={`block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary ${Icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);