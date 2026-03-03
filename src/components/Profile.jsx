import { useState, useEffect } from "react"; // <-- MODIFIED: Added useEffect
import {
  UserRound,
  Edit,
  Mail,
  Phone,
  QrCode,
  FilePenLine,
  HeartPulse,
  Stethoscope,
  Thermometer,
} from "lucide-react";

// <-- NEW: Import your custom api service
import api from "../services/api";

// Reusable Input Component
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
      value={value || ""} // <-- MODIFIED: Handles null/undefined values
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
    />
  </div>
);

// Patient Activity Section  
function PatientActivity() {
  return (
    <div className="w-full">
      <h2 className="text-3xl text-left font-bold text-green-900 mb-6">
        Patient Activity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-400">
          <h3 className="text-xl  text-left font-semibold text-green-900 mb-6">
            Upcoming Appointments
          </h3>
          <div className="relative pl-6 text-left  border-l-2 border-gray-300 space-y-8">
            <TimelineItem
              color="bg-green-600"
              title="Cardiology Consult"
              date="Oct 25, 2025 - 10:00 AM"
            />
            <TimelineItem
              color="bg-green-600"
              title="Physical Therapy"
              date="Oct 26, 2025 - 02:00 PM"
            />
          </div>
        </div>

        {/* Recent Vitals */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-700">
          <h3 className="text-left text-xl font-semibold text-green-900 mb-6">
            Recent Vitals
          </h3>
          <div className="text-left relative pl-6 border-l-2 border-gray-300 space-y-8">
            <VitalItem
              color="bg-green-600"
              title="Blood Pressure"
              value="120/80"
              unit="mmHg"
              status="Normal"
              icon={<Stethoscope className="w-5 h-5 text-green-700" />}
            />
            <VitalItem
              color="bg-green-600"
              title="Heart Rate"
              value="72"
              unit="bpm"
              status="Normal"
              icon={<HeartPulse className="w-5 h-5 text-green-700" />}
            />
            <VitalItem
              color="bg-orange-500"
              title="Temperature"
              value="37.8"
              unit="°C"
              status="Slight Fever"
              icon={<Thermometer className="w-5 h-5 text-orange-600" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Item (for Patient Activity)  
const TimelineItem = ({ color, title, date }) => (
  <div className="relative">
    <div
      className={`absolute w-4 h-4 ${color} rounded-full -left-[33px] top-1 border-4 border-white`}
    ></div>
    <h4 className="font-semibold text-green-800 text-lg">{title}</h4>
    <p className="text-sm text-gray-500">{date}</p>
  </div>
);

// Vitals Item  
const VitalItem = ({ color, title, value, unit, status, icon }) => (
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
        status === "Slight Fever" ? "text-orange-600" : "text-green-600"
      }`}
    >
      {status}
    </p>
  </div>
);

// Display Mode  
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
            <ProfileField label="Patient ID" value={data.patientId} />
            <ProfileField label="Date of Birth" value={data.dob} />
            <ProfileField label="Blood Type" value={data.bloodType} />
            <ProfileField label="Address" value={data.address} />
            <ProfileField label="Phone" value={data.phoneNumber} />
            <ProfileField label="Admitted" value={data.admitted} />
            <ProfileField
              label="Emergency Contact"
              value={data.emergencyContactName}
            />
            <ProfileField
              label="Emergency Contact Number"
              value={data.emergencyContactPhone}
            />
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
              href={`tel:${data.phoneNumber}`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <Phone className="w-5 h-5" />
              Call
            </a>
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col items-center justify-start pt-4 md:pt-0">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Patient ID QR Code
          </h3>
          <QrCode className="w-32 h-32 text-green-900" />
          <p className="text-xs text-gray-500 mt-2">Scan for Patient Record</p>
        </div>
      </div>
    </div>
  );
}

// Profile Info Row
const ProfileField = ({ label, value }) => (
  <p>
    <span className="font-semibold text-green-800 w-32 inline-block">
      {label}:
    </span>{" "}
    {value || "N/A"} {/* <-- MODIFIED: Handles null/undefined values */}
  </p>
);

// Edit Form  
function ProfileEditForm({ data, onChange, onSave, onCancel }) {
  const CancelIcon = FilePenLine;
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">
          Edit Patient Profile
        </h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-green-900 px-4 py-2 rounded-md text-sm font-medium"
        >
          <CancelIcon className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <div className="space-y-4 text-left">
        <FormInput label="Name" name="name" value={data.name} onChange={onChange} />
        <FormInput
          label="Patient ID"
          name="patientId"
          value={data.patientId}
          onChange={onChange}
        />
        <FormInput
          label="Date of Birth"
          name="dob"
          value={data.dob}
          onChange={onChange}
        />
        <FormInput
          label="Blood Type"
          name="bloodType"
          value={data.bloodType}
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
          name="phoneNumber"
          value={data.phoneNumber}
          onChange={onChange}
        />
        <FormInput
          label="Admitted"
          name="admitted"
          value={data.admitted}
          onChange={onChange}
        />
        <hr className="my-4" />
        <h3 className="text-lg font-semibold text-green-900">
          Emergency Contact
        </h3>
        <FormInput
          label="Contact Name"
          name="emergencyContactName"
          value={data.emergencyContactName}
          onChange={onChange}
        />
        <FormInput
          label="Contact Phone"
          name="emergencyContactPhone"
          value={data.emergencyContactPhone}
          onChange={onChange}
        />

        <div className="pt-4">
          <button
            onClick={onSave}
            className="bg-green-800 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Sidebar  
function PatientSidebar({ emergencyContact }) {
  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit lg:mt-16">
      <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Status: Admitted
      </span>

      <div className="mt-6 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Key Information
        </h3>
        <InfoItem label="Primary Physician" value="Dr. R. Alon, MD" />
        <InfoItem label="Room" value="305B, West Wing" />
        <InfoItem label="Diet" value="Low Sodium, Soft Foods" />
      </div>

      <div className="mt-8 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Allergies</h3>
        <div className="flex flex-wrap gap-2">
          <Badge label="Penicillin" color="red" />
          <Badge label="Peanuts" color="yellow" />
          <Badge label="Dust" color="gray" />
        </div>
      </div>
    </div>
  );
}

// InfoItem for Sidebar  
const InfoItem = ({ label, value }) => (
  <div className="relative pl-6 border-l-2 border-green-700 space-y-1 mb-4">
    <div className="absolute w-4 h-4 bg-green-700 rounded-full -left-[9px] top-1 border-4 border-white"></div>
    <h4 className="font-semibold text-green-800">{label}</h4>
    <p className="text-sm text-gray-600">{value}</p>
  </div>
);

//Badge for Allergies  
const Badge = ({ label, color }) => (
  <span
    className={`bg-${color}-100 text-${color}-800 text-xs font-medium px-2.5 py-0.5 rounded-full`}
  >
    {label}
  </span>
);

// -----------------------------------------------------------------
// MAIN COMPONENT 
// -----------------------------------------------------------------
export default function PatientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    patientId: "",
    dob: "",
    bloodType: "",
    address: "",
    admitted: "",
    email: "",
    phoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [originalData, setOriginalData] = useState(profileData);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/me");

        // Map 'phone' from database to 'phoneNumber' in state
        const data = {
          ...response.data,
          phoneNumber: response.data.phone || "", // Map 'phone' to 'phoneNumber'
        };

        setProfileData(data);
        setOriginalData(data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []); // Empty array means this runs once when the component mounts

  const handleEdit = () => {
    setOriginalData(profileData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/profile", profileData);

      // Your controller returns the updated user, let's use it
      const data = {
        ...response.data.user,
        phoneNumber: response.data.user.phone || "", // Map 'phone' to 'phoneNumber'
      };

      setProfileData(data);
      setOriginalData(data);
      setIsEditing(false);
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile data:", error);
      if (error.response && error.response.status === 422) {
        console.error("Validation Errors:", error.response.data);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FBF8] p-8 flex justify-center items-center">
        <h2 className="text-2xl font-bold text-green-900">
          Loading Profile...
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FBF8] p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${isEditing ? "" : "mt-16"}`}>
            {isEditing ? (
              <ProfileEditForm
                data={profileData}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <ProfileDisplay data={profileData} onEdit={handleEdit} />
            )}
          </div>

          <PatientSidebar
            emergencyContact={{
              name: profileData.emergencyContactName,
              phone: profileData.emergencyContactPhone,
            }}
          />
        </div>
        <PatientActivity />
      </div>
    </div>
  );
}