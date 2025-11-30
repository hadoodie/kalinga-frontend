import { useState, useEffect } from "react";
import {
  UserRound,
  Edit,
  Mail,
  Phone,
  QrCode,
  FilePenLine,
  Truck,
  Package,
  Clock,
  Loader2,
} from "lucide-react";

import { formatDistanceToNow } from 'date-fns'; 
import api from "../../services/api"; // Assuming your API service is correctly configured

// --- 1. Form Input Component ---
const FormInput = ({ label, name, value, onChange }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-green-900 mb-1"
    >
      {label}:
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
    />
  </div>
);

// --- 2. Logistics Activity (Display-Only Component) ---
function LogisticsActivity() {
  const [recentAllocations, setRecentAllocations] = useState([]);
  const [activeShipments, setActiveShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogisticsData = async () => {
      try {
        const [incomingResponse, historyResponse] = await Promise.all([
          api.get('/incoming-requests'),
          api.get('/allocation-history')
        ]);
        
        const incomingData = incomingResponse.data.map(req => ({
          ...req,
          displayDestination: req.source_location || 'Unknown Location'
        }));

        const historyData = historyResponse.data.map(req => ({
          ...req,
          displayDestination: req.destination_hospital || req.source_location || 'Unknown Location'
        }));
        
        // Combine both active and completed allocations
        const combinedAllocations = [...incomingData, ...historyData]
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) 
          .slice(0, 5); 

        setRecentAllocations(combinedAllocations);

        // --- 2. GET SHIPMENT DATA (Active shipments from supply tracking) ---
        const shipmentsResponse = await api.get('/supply-tracking');
        
        // Filter and map active shipments
        const activeShipmentsData = shipmentsResponse.data
            .filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled') // Only active
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5)
            .map(s => {
                const destination = s.route ? s.route.split(' → ').pop() : 'Unknown Destination';
                return {
                    id: s.id,
                    tracking_id: s.tracking_id || `T-${s.id}`,
                    status: s.status,
                    priority: s.priority || 'Medium',
                    contents: s.contents || 'Various Items',
                    destination: destination,
                    updated_at: s.updated_at
                };
            });

        setActiveShipments(activeShipmentsData);

      } catch (error) {
        console.error("Failed to fetch logistics activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogisticsData();
  }, []);

  // Helper function to dynamically map status icon
  const getShipmentIcon = (status) => {
    if (status === 'In Transit' || status === 'On-the-Way' || status === 'Shipped') {
        return <Truck className="w-5 h-5 text-green-700" />;
    }
    return <Package className="w-5 h-5 text-green-700" />;
  };

  if (isLoading) {
    return (
      <div className="w-full text-center py-10">
        <h3 className="text-xl font-bold text-green-900 flex items-center justify-center">
          <Loader2 className="w-6 h-6 mr-2 animate-spin text-green-800" /> Loading Logistics Data...
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl text-left font-bold text-green-900 mb-6">
        Logistics Activity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Allocations */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-400">
          <h3 className="text-xl text-left font-semibold text-green-900 mb-6">
            Recent Allocations ({recentAllocations.length})
          </h3>
          <div className="relative pl-6 text-left border-l-2 border-gray-300 space-y-8">
            {recentAllocations.length > 0 ? (
              recentAllocations.map((req) => (
                <TimelineItem
                  key={req.id}
                  color={
                    req.status === 'Delivered' ? 'bg-green-600' : 
                    req.status === 'Cancelled' ? 'bg-red-600' : 
                    'bg-blue-600'
                  }
                  title={`${req.item_name || 'Unknown Item'} (Qty: ${req.item_quantity || 0}) → ${req.displayDestination}`}
                  date={`${req.status} • ${formatDistanceToNow(new Date(req.updated_at), { addSuffix: true })}`}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent allocation updates found.</p>
            )}
          </div>
        </div>

        {/* Active Shipments */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-700">
          <h3 className="text-left text-xl font-semibold text-green-900 mb-6">
            Active Shipments ({activeShipments.length})
          </h3>
          <div className="text-left relative pl-6 border-l-2 border-gray-300 space-y-8">
            {activeShipments.length > 0 ? (
              activeShipments.map((s) => (
                <ShipmentItem
                  key={s.id}
                  color={s.priority === 'Critical' || s.status === 'Delayed' ? "bg-red-500" : "bg-green-600"}
                  title={`${s.tracking_id} - ${s.status}`}
                  value={s.contents.split(',')[0]}
                  unit={`To: ${s.destination}`}
                  status={s.status}
                  icon={getShipmentIcon(s.status)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No active shipments in transit.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Allocations Timeline Item
const TimelineItem = ({ color, title, date }) => (
  <div className="relative">
    <div
      className={`absolute w-4 h-4 ${color} rounded-full -left-[33px] top-1 border-4 border-white`}
    ></div>
    <h4 className="font-semibold text-green-800 text-lg">{title}</h4>
    <p className="text-sm text-gray-500">{date}</p>
  </div>
);

// Active Shipments Item
const ShipmentItem = ({ color, title, value, unit, status, icon }) => (
  <div className="relative">
    <div
      className={`absolute w-4 h-4 ${color} rounded-full -left-[33px] top-1 border-4 border-white`}
    ></div>
    <div className="flex justify-between items-center">
      <h4 className="font-semibold text-green-800 text-lg">{title}</h4>
      {icon}
    </div>
    <p className="text-lg font-medium text-gray-700">
      {value} <span className="text-sm font-normal">{unit}</span>
    </p>
    <p
      className={`text-sm font-medium ${
        status === "Delayed" ? "text-orange-600" : "text-green-600"
      }`}
    >
      {status}
    </p>
  </div>
);

// --- 3. Profile Display Mode Component --- 
function ProfileDisplay({ data, onEdit }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 pt-16 relative">
      <button
        onClick={onEdit}
        className="absolute top-6 right-6 flex-shrink-0 flex items-center text-gray-600 hover:text-green-700 text-sm"
      >
        <Edit className="w-4 h-4 mr-1" />
        Edit
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-24 h-24 bg-green-800 rounded-full flex items-center justify-center border-4 border-white shadow-md">
        <UserRound className="w-16 h-16 text-white" strokeWidth={1.5} />
      </div>

      <h1 className="text-3xl font-bold text-green-900 text-center">
        {data.name}
      </h1>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-2 text-gray-700 text-left">
            <ProfileField label="Employee ID" value={data.id} />
            <ProfileField label="Role" value={data.role} />
            <ProfileField label="Department" value={data.department} />
            <ProfileField label="Assigned Facility" value={data.assigned_facility} />
            <ProfileField label="Shift Schedule" value={data.shift_schedule} />
            <ProfileField label="Address" value={data.address} />
            <ProfileField label="Phone" value={data.phone} />
            <ProfileField label="Email" value={data.email} />
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href={`mailto:${data.email}`}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
            <a
              href={`tel:${data.phone}`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <Phone className="w-5 h-5" />
              Call
            </a>
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col items-center justify-start pt-4 md:pt-0">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Employee QR Code
          </h3>
          <QrCode className="w-32 h-32 text-green-900" />
          <p className="text-xs text-gray-500 mt-2">Scan for Logistics Record</p>
        </div>
      </div>
    </div>
  );
}

const ProfileField = ({ label, value }) => (
  <p>
    <span className="font-semibold text-green-800 w-32 inline-block">
      {label}:
    </span>{" "}
    {value || "N/A"}
  </p>
);

// --- 4. Profile Edit Form Component (MODIFIED to accept isSaving) --- 
function ProfileEditForm({ data, onChange, onSave, onCancel, isSaving }) {
  const CancelIcon = FilePenLine; 
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">
          Edit Logistics Profile
        </h2>
        <button
          onClick={onCancel}
          disabled={isSaving} // Disable Cancel while saving
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-green-900 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          <CancelIcon className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="space-y-4 text-left">
        <FormInput label="Name" name="name" value={data.name} onChange={onChange} />
        <FormInput
          label="Department"
          name="department"
          value={data.department}
          onChange={onChange}
        />
        <FormInput
          label="Assigned Facility"
          name="assigned_facility"
          value={data.assigned_facility}
          onChange={onChange}
        />
        <FormInput
          label="Shift Schedule"
          name="shift_schedule"
          value={data.shift_schedule}
          onChange={onChange}
        />
        <FormInput
          label="Address"
          name="address"
          value={data.address}
          onChange={onChange}
        />
        <FormInput
          label="Email"
          name="email"
          value={data.email}
          onChange={onChange}
        />
        <FormInput
          label="Phone Number"
          name="phone"
          value={data.phone}
          onChange={onChange}
        />

        <div className="pt-4">
          <button
            onClick={onSave}
            type="button"
            disabled={isSaving} // Disable Save while saving
            className="flex items-center justify-center bg-green-800 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 5. Sidebar Component (Display-Only) ---
function LogisticsSidebar({ data }) {
  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit lg:mt-16">
      <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Status: Active
      </span>

      <div className="mt-6 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Key Information
        </h3>
        <InfoItem label="Department" value={data.department} />
        <InfoItem label="Assigned Facility" value={data.assigned_facility} />
        <InfoItem label="Shift Schedule" value={data.shift_schedule} />
      </div>

      <div className="mt-8 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Certifications</h3>
        <div className="flex flex-wrap gap-2">
          <Badge label="Supply Chain Mgmt" color="green" />
          <Badge label="Inventory Control" color="blue" />
          <Badge label="Emergency Response" color="yellow" />
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value }) => (
  <div className="relative pl-6 border-l-2 border-green-700 space-y-1 mb-4">
    <div className="absolute w-4 h-4 bg-green-700 rounded-full -left-[9px] top-1 border-4 border-white"></div>
    <h4 className="font-semibold text-green-800">{label}</h4>
    <p className="text-sm text-gray-600">{value}</p>
  </div>
);

const Badge = ({ label, color }) => (
  <span
    className={`bg-${color}-100 text-${color}-800 text-xs font-medium px-2.5 py-0.5 rounded-full`}
  >
    {label}
  </span>
);

// --- 6. MAIN COMPONENT (LogisticsProfile) ---
export default function LogisticsProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // New state for saving status
  const [profileData, setProfileData] = useState({
    name: "",
    role: "Logistics Officer",
    department: "",
    assigned_facility: "",
    shift_schedule: "",
    address: "",
    email: "",
    phone: "",
    id: "LOG-001", // Placeholder ID
  });

  // State to hold data before edits for cancellation
  const [originalData, setOriginalData] = useState(profileData);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch user data from your API (e.g., /me or /user/{id})
        const response = await api.get("/me"); 

        // Apply default/derived values
        const data = {
          ...response.data,
          // Retain local derived values or fill defaults if API returns null/undefined
          role: "Logistics Officer",
          id: response.data.id || "LOG-001",
          department: response.data.department || "Logistics & Supply Chain",
          assigned_facility: response.data.assigned_facility || "Central Depot A",
          shift_schedule: response.data.shift_schedule || "8:00 AM - 5:00 PM",
          // Ensure all required fields exist for FormInput
          name: response.data.name || "",
          address: response.data.address || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
        };

        setProfileData(data);
        setOriginalData(data); // Set initial original data
      } catch (error) {
        console.error("Error fetching profile data:", error);
        alert("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // --- Handlers ---
  const handleEdit = () => {
    // Save current (unmodified) profileData as originalData before editing
    setOriginalData(profileData); 
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset profileData to the last saved state (originalData)
    setProfileData(originalData); 
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update profileData with the new value from the input field
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ... in LogisticsProfile.js

const handleSave = async () => {
    setIsSaving(true); // Start saving process
    try {
        console.log('Attempting to save profile data:', profileData);

        const updatePayload = {
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            department: profileData.department,
            assigned_facility: profileData.assigned_facility,
            shift_schedule: profileData.shift_schedule,
        };

        // *** CORRECTION APPLIED HERE ***
        // Use the correct route: PUT /profile
        const response = await api.put("/profile", updatePayload); 
        
        console.log('Update response:', response.data);

        // Assuming the response data contains the updated user object
        const updatedData = {
            ...profileData, 
            ...response.data, 
        };

        setProfileData(updatedData);
        setOriginalData(updatedData);
        setIsEditing(false);
        
        alert("Profile updated successfully!");

    } catch (error) {
        console.error("Error saving profile data:", error);
        
        if (error.response && error.response.data) {
            let message = "Failed to update profile. ";
            // ... (rest of error handling logic remains the same)
            
            if (error.response.status === 404) {
                 alert("Route Error: The API route '/profile' was not reachable. Check your base API URL.");
            } else if (error.response.status === 422 && error.response.data.errors) {
                const errors = error.response.data.errors;
                const errorMessages = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                    .join('\n');
                message += "\nValidation Errors:\n" + errorMessages;
                alert(message);
            } else {
                 alert("Failed to update profile: " + (error.response.data.message || "Unknown server error."));
            }
        } else {
            alert("Failed to update profile. Please check your network connection.");
        }
    } finally {
        setIsSaving(false); 
    }
};
// ...


  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <h2 className="text-2xl font-bold text-green-900">
          <Loader2 className="w-6 h-6 mr-2 animate-spin text-green-800 inline-block" />
          Loading Profile...
        </h2>
      </div>
    );
  }

  // --- Render Profile View or Edit Form ---
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${isEditing ? "" : "mt-16"}`}>
            {isEditing ? (
              <ProfileEditForm
                data={profileData}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving} 
              />
            ) : (
              <ProfileDisplay data={profileData} onEdit={handleEdit} />
            )}
          </div>

          <LogisticsSidebar data={profileData} />
        </div>
        <LogisticsActivity />
      </div>
    </div>
  );
}