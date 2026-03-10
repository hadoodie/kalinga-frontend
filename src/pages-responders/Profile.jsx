import React, { useEffect, useState } from "react";
import Layout from "../layouts/Layout";
import { QRCodeCanvas } from "qrcode.react";
import nodeApi from "../services/nodeApi";

const EMPTY_PROFILE = {
  name: "",
  role: "",
  id: "",
  email: "",
  phone: "",
  registered: "",
  responderStatus: "",
};

const FormInput = ({ label, name, value, onChange, disabled = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-green-900 mb-1 text-left">
      {label}:
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
    />
  </div>
);

const ProfileField = ({ label, value }) => (
  <p className="text-gray-700 text-left">
    <span className="font-semibold text-green-800 w-48 inline-block">{label}:</span>{" "}
    {value || "N/A"}
  </p>
);

const ActivityTimelineItem = ({ title, date }) => (
  <div className="relative">
    <div className="absolute w-4 h-4 bg-green-600 rounded-full -left-[33px] top-1 border-4 border-white"></div>
    <h4 className="font-semibold text-green-800 text-lg">{title}</h4>
    <p className="text-sm text-gray-500">{date}</p>
  </div>
);

const ProgressItem = ({ title, status, progress, color }) => (
  <div className="relative">
    <div className={`absolute w-4 h-4 ${color} rounded-full -left-[33px] top-1 border-4 border-white`}></div>
    <h4 className="font-semibold text-green-800 text-lg text-left">{title}</h4>
    <p className="text-sm font-medium text-gray-700 text-left">{status}</p>
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const mapTrainingStatus = (status, progressPercent) => {
  if (status === "completed") return { label: "Completed", color: "bg-green-600", pct: 100 };
  if (status === "in_progress") {
    const pct = Number(progressPercent || 0);
    return { label: `In Progress - ${pct}%`, color: "bg-orange-500", pct };
  }
  if (status === "failed") return { label: "Failed", color: "bg-red-500", pct: Number(progressPercent || 0) };
  return { label: "Not Started", color: "bg-gray-400", pct: 0 };
};

function ProfileDisplay({ data, onEdit, qrToken, qrLoading }) {
  // Use server-issued token; fall back to responder code if token unavailable
  const qrValue = qrToken || (data.id ? `responder:${data.id}` : data.email || "unknown");

  return (
    <div className="bg-white rounded-lg shadow-md p-6 pt-16 relative">
      <button
        onClick={onEdit}
        className="absolute top-6 right-6 flex-shrink-0 flex items-center text-gray-600 hover:text-green-700 text-sm"
      >
        Edit
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-24 h-24 bg-green-800 rounded-full flex items-center justify-center border-4 border-white shadow-md">
        <div className="w-16 h-16 text-white text-4xl font-bold pt-2">{getInitials(data.name)}</div>
      </div>

      <div className="text-center mb-6 mt-2">
        <h1 className="text-3xl font-bold text-green-900">Responder Profile</h1>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-4 text-gray-700 text-left">
            <ProfileField label="Responder Name" value={data.name} />
            <ProfileField label="Responder ID" value={data.id} />
            <ProfileField label="Role" value={data.role} />
            <ProfileField label="Phone" value={data.phone} />
            <ProfileField label="Email" value={data.email} />
            <ProfileField label="Registered Since" value={data.registered} />
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col items-center justify-start pt-4 md:pt-0">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Profile QR Code</h3>
          <div className="p-2 bg-white border border-gray-300 rounded-lg shadow">
            {qrLoading ? (
              <div className="w-[120px] h-[120px] flex items-center justify-center text-xs text-gray-400">Loading...</div>
            ) : (
              <QRCodeCanvas
                value={qrValue}
                size={120}
                bgColor="#ffffff"
                fgColor="#02462E"
                level="H"
                includeMargin={false}
              />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Scan to responder record</p>
        </div>
      </div>
    </div>
  );
}

function ProfileEditForm({ data, onChange, onSave, onCancel, isSaving, saveError }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">Edit Responder Profile</h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-green-900 px-4 py-2 rounded-md text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {saveError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{saveError}</p>}

      <p className="text-xs text-gray-500 mb-4">
        Only <strong>Name</strong> and <strong>Phone Number</strong> can be updated.
      </p>

      <div className="space-y-4 text-left">
        <FormInput label="Name" name="name" value={data.name} onChange={onChange} />
        <FormInput label="Phone Number" name="phone" value={data.phone} onChange={onChange} />
        <FormInput label="Role" name="role" value={data.role} onChange={onChange} disabled />
        <FormInput label="Email" name="email" value={data.email} onChange={onChange} disabled />
        <FormInput label="Registered Since" name="registered" value={data.registered} onChange={onChange} disabled />
        <FormInput label="ID Number" name="id" value={data.id} onChange={onChange} disabled />

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="bg-green-800 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponderSidebar({ status, certifications }) {
  const isActive = ["On Duty", "Available"].includes(status);

  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit lg:mt-16">
      <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
        <span className={`w-2 h-2 ${isActive ? "bg-green-500" : "bg-gray-400"} rounded-full mr-2`}></span>
        Status: {status || "Unknown"}
      </span>

      <div className="mt-8 text-left">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Certifications</h3>
        {certifications.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No certifications on file.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {certifications.slice(0, 6).map((cert) => (
              <span
                key={cert.id || cert.course_id}
                className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {cert.course_title || "Certification"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResponderActivity({ activity, training, loading }) {
  return (
    <div className="w-full">
      <h2 className="text-3xl text-left font-bold text-green-900 mb-6">Activity Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-400">
          <h3 className="text-xl text-left font-semibold text-green-900 mb-6">Recent Logs</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <div className="relative pl-6 text-left border-l-2 border-gray-300 space-y-8">
              {activity.slice(0, 5).map((item) => (
                <ActivityTimelineItem
                  key={item.id}
                  title={item.description || item.action || "Activity"}
                  date={formatDate(item.created_at)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-green-700">
          <h3 className="text-left text-xl font-semibold text-green-900 mb-6">Training Progress</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading training progress...</p>
          ) : training.length === 0 ? (
            <p className="text-sm text-gray-500">No training records yet.</p>
          ) : (
            <div className="text-left relative pl-6 border-l-2 border-gray-300 space-y-8">
              {training.slice(0, 5).map((item) => {
                const mapped = mapTrainingStatus(item.status, item.progress_percent);
                return (
                  <ProgressItem
                    key={`${item.course_id}-${item.id}`}
                    title={item.course_title || "Training Module"}
                    status={mapped.label}
                    progress={mapped.pct}
                    color={mapped.color}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [tempProfile, setTempProfile] = useState(EMPTY_PROFILE);
  const [activity, setActivity] = useState([]);
  const [training, setTraining] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [qrToken, setQrToken] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileRes, activityRes, trainingRes, certRes] = await Promise.all([
          nodeApi.get("/profile"),
          nodeApi.get("/activity", { params: { limit: 10 } }),
          nodeApi.get("/training/progress"),
          nodeApi.get("/training/certifications"),
        ]);

        const profileData = profileRes?.data?.data || {};
        const numericUserId = profileData.id || profileData.user_id || "";
        const mappedProfile = {
          name: profileData.responder_name || profileData.name || "",
          role: profileData.role ? String(profileData.role).replaceAll("_", " ") : "Responder",
          id: profileData.responder_code || profileData.responder_id || String(numericUserId),
          numericId: numericUserId,
          email: profileData.email || "",
          phone: profileData.phone || "",
          registered: formatDate(profileData.created_at),
          responderStatus: profileData.responder_status || "",
        };

        setProfile(mappedProfile);
        setTempProfile(mappedProfile);
        setActivity(activityRes?.data?.data || []);
        setTraining(trainingRes?.data?.data || []);
        setCertifications(certRes?.data?.data || []);

        // Fetch server-issued QR token (or create one if none exists)
        if (numericUserId) {
          setQrLoading(true);
          try {
            const qrRes = await nodeApi.get(`/qr/user/${numericUserId}`);
            if (qrRes?.data?.data?.qr_uid) {
              setQrToken(qrRes.data.data.qr_uid);
            } else {
              // No active QR — bind a new one
              const bindRes = await nodeApi.post("/qr/bind", { user_id: numericUserId });
              setQrToken(bindRes?.data?.data?.qr_uid || null);
            }
          } catch {
            // QR unavailable — fall back to responder code as QR value
            setQrToken(null);
          } finally {
            setQrLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load responder profile data", err);
        setError("Unable to load profile data. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTempProfile((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      const payload = {
        name: tempProfile.name,
        phone: tempProfile.phone,
      };

      const response = await nodeApi.put("/profile", payload);
      const updatedProfile = response?.data?.data || {};

      const merged = {
        ...profile,
        name: updatedProfile.name || tempProfile.name,
        phone: updatedProfile.phone || tempProfile.phone,
      };

      setProfile(merged);
      setTempProfile(merged);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save responder profile", err);
      setSaveError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setSaveError("");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full bg-[#F8FBF8] p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">Loading profile...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="h-full bg-[#F8FBF8] p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6 text-red-700">{error}</div>
          </div>
        </div>
      </Layout>
    );
  }

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
                  isSaving={isSaving}
                  saveError={saveError}
                />
              ) : (
                <ProfileDisplay data={profile} onEdit={() => setIsEditing(true)} qrToken={qrToken} qrLoading={qrLoading} />
              )}
            </div>

            <ResponderSidebar status={profile.responderStatus} certifications={certifications} />
          </div>

          <ResponderActivity activity={activity} training={training} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
