import React, { useState } from "react";
import Layout from "../layouts/Layout";
import { QRCodeCanvas } from "qrcode.react";

// Reusable Input Component
const FormInput = ({ label, name, value, onChange }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-green-900 mb-1 text-left"
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

// Profile Info Row
const ProfileField = ({ label, value }) => (
  <p className="text-gray-700 text-left">
    <span className="font-semibold text-green-800 w-48 inline-block">
      {label}:
    </span>{" "}
    {value || "N/A"}
  </p>
);

// Timeline/Info Item
const InfoItem = ({ label, role }) => (
  <div className="relative pl-6 border-l-2 border-green-700 space-y-1 mb-4">
    <div className="absolute w-4 h-4 bg-green-700 rounded-full -left-[9px] top-1 border-4 border-white"></div>
    <h4 className="font-semibold text-green-800">{label}</h4>
    {role && <p className="text-sm text-gray-600 italic">{role}</p>}
  </div>
);

// Activity Timeline Item
const ActivityTimelineItem = ({ title, date }) => (
  <div className="relative">
    <div
      className={`absolute w-4 h-4 bg-green-600 rounded-full -left-[33px] top-1 border-4 border-white`}
    ></div>
    <h4 className="font-semibold text-green-800 text-lg">{title}</h4>
    <p className="text-sm text-gray-500">{date}</p>
  </div>
);

// Progress Item
const ProgressItem = ({ title, status, progress, color }) => (
  <div className="relative">
    <div
      className={`absolute w-4 h-4 ${color} rounded-full -left-[33px] top-1 border-4 border-white`}
    ></div>
    <h4 className="font-semibold text-green-800 text-lg text-left">{title}</h4>
    <p className="text-sm font-medium text-gray-700 text-left">{status}</p>
    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

// Badge
const Badge = ({ label, color }) => (
  <span
    className={`bg-${color}-100 text-${color}-800 text-xs font-medium px-2.5 py-0.5 rounded-full`}
  >
    {label}
  </span>
);

// Responder Display Mode
function ProfileDisplay({ data, onEdit }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 pt-16 relative">
      <button
        onClick={onEdit}
        className="absolute top-6 right-6 flex-shrink-0 flex items-center text-gray-600 hover:text-green-700 text-sm"
      >
        Edit
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-24 h-24 bg-green-800 rounded-full flex items-center justify-center border-4 border-white shadow-md">
        <div className="w-16 h-16 text-white text-4xl font-bold pt-2">JS</div>
      </div>

      <div className="text-center mb-6 mt-2">
         <h1 className="text-3xl font-bold text-green-900">
           Responder Verified
         </h1>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-4 text-gray-700 text-left">
            <ProfileField label="Responder Name" value={data.name} />
            <ProfileField label="Responder ID" value={data.id} />
            <ProfileField label="Role" value={data.role} />
            <ProfileField label="Age" value={data.age} />
            <ProfileField label="Address" value={data.address} />
            <ProfileField label="Phone" value={data.phone} />
            <ProfileField label="Email" value={data.email} />
            <ProfileField label="Registered Since" value={data.registered} />
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col items-center justify-start pt-4 md:pt-0">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Profile QR Code
          </h3>
          <div className="p-2 bg-white border border-gray-300 rounded-lg shadow">
            <QRCodeCanvas
              value={`Name: ${data.name}\nRole: ${data.role}\nID: ${data.id}`}
              size={120}
              bgColor="#ffffff"
              fgColor="#02462E"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Scan to Responders Record</p>
        </div>
      </div>
    </div>
  );
}

// Responder Edit Form
function ProfileEditForm({ data, onChange, onSave, onCancel }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">
          Edit Responder Profile
        </h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-green-900 px-4 py-2 rounded-md text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4 text-left">
        <FormInput label="Name" name="name" value={data.name} onChange={onChange} />
        <FormInput label="Role" name="role" value={data.role} onChange={onChange} />
        <FormInput label="Age" name="age" value={data.age} onChange={onChange} />
        <FormInput
          label="Address"
          name="address"
          value={data.address}
          onChange={onChange}
        />
        <FormInput
          label="Phone Number"
          name="phone"
          value={data.phone}
          onChange={onChange}
        />
        <FormInput
          label="Email"
          name="email"
          value={data.email}
          onChange={onChange}
        />
        <FormInput
          label="Registered Since"
          name="registered"
          value={data.registered}
          onChange={onChange}
        />
        <FormInput
          label="ID Number"
          name="id"
          value={data.id}
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

// Responder Sidebar
function ResponderSidebar() {
  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit lg:mt-16">
      <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Status: Active - On Duty
      </span>

      <div className="mt-6 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Affiliations
        </h3>
        <InfoItem
          label="Philippine General Hospital"
          role="Resident Physician"
        />
        <InfoItem
          label="Philippine Heart Center"
          role="Emergency Responder Pool"
        />
        <InfoItem
          label="St. Luke’s Medical Center"
          role="Training Partner – BLS Program"
        />
      </div>

      <div className="mt-8 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge label="Advanced Trauma" color="blue" />
          <Badge label="BLS Certified" color="green" />
          <Badge label="Disaster Relief" color="indigo" />
        </div>
      </div>
    </div>
  );
}

// Responder Activity Section
function ResponderActivity() {
  return (
    <div className="w-full">
      <h2 className="text-3xl text-left font-bold text-green-900 mb-6">
        Activity Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-400">
          <h3 className="text-xl text-left font-semibold text-green-900 mb-6">
            Recent Logs
          </h3>
          <div className="relative pl-6 text-left border-l-2 border-gray-300 space-y-8">
            <ActivityTimelineItem
              title="Flood Response, Quezon City"
              date="Sept 20, 2025"
            />
            <ActivityTimelineItem
              title="Earthquake Drill, Pasig"
              date="Sept 12, 2025"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-green-700">
          <h3 className="text-left text-xl font-semibold text-green-900 mb-6">
            Training Progress
          </h3>
          <div className="text-left relative pl-6 border-l-2 border-gray-300 space-y-8">
            <ProgressItem
              title="First Aid Basics"
              status="Completed"
              progress={100}
              color="bg-green-600"
            />
            <ProgressItem
              title="Mass Casualty Management"
              status="In Progress - 60%"
              progress={60}
              color="bg-orange-500"
            />
            <ProgressItem
              title="Advanced Trauma Care"
              status="Locked"
              progress={0}
              color="bg-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// MAIN COMPONENT - Profile
const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Santos",
    role: "Medical Responder",
    age: "27 years old",
    address: "123 Mabini St., San Pedro, Laguna",
    registered: "September 15, 2025",
    id: "KAL-2025-0342",
    email: "john.santos@email.com",
    phone: "(+63) 917-000-1234",
    linkedin: "https://linkedin.com/in/johnsantos",
  });

  const [tempProfile, setTempProfile] = useState(profile);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempProfile({ ...tempProfile, [name]: value });
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="h-full bg-[#F8FBF8] p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${isEditing ? "" : "mt-16"}`}>
              {isEditing ? (
                <ProfileEditForm
                  data={tempProfile}
                  onChange={handleChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <ProfileDisplay data={profile} onEdit={() => setIsEditing(true)} />
              )}
            </div>

            <ResponderSidebar />
          </div>
          <ResponderActivity />
        </div>
      </div>
    </Layout>
  );
};

export default Profile;