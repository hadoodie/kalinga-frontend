import { useState } from 'react';

export default function ResidentProfile() {
  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    gpsEnabled: false,
    householdSize: 0,
    hasChildren: false,
    hasElderly: false,
    hasPWD: false,
    hasPets: false,
    medicalNeeds: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!profile.firstName) newErrors.firstName = 'First name is required';
    if (!profile.lastName) newErrors.lastName = 'Last name is required';
    if (!profile.phone) newErrors.phone = 'Mobile number is required';
    if (!profile.email || !/\S+@\S+\.\S+/.test(profile.email)) newErrors.email = 'Valid email is required';
    if (!profile.address) newErrors.address = 'Home address is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
    } else {
      setErrors({});
      console.log('Profile saved:', profile);
      // Add save logic here
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-primary mb-4 text-left">Resident Profile</h2>

      {/* Basic Info */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-primary text-left mb-2">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="First Name"
                className="input w-full"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>
            <input
              type="text"
              placeholder="Middle Name"
              className="input w-full"
              value={profile.middleName}
              onChange={(e) => setProfile({ ...profile, middleName: e.target.value })}
            />
            <div>
              <input
                type="text"
                placeholder="Last Name"
                className="input w-full"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
              {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="date"
              className="input"
              value={profile.birthDate}
              onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
            />
            <select
              className="input"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="">Gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Prefer not to say</option>
            </select>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-primary text-left mb-2">Contact Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input
              type="tel"
              placeholder="Mobile Number"
              className="input w-full"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email Address"
              className="input w-full"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-primary text-left mb-2">Home & Location</h3>
        <div>
          <input
            type="text"
            placeholder="Home Address (Barangay, Zone)"
            className="input w-full mb-2"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          />
          {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={profile.gpsEnabled}
            onChange={(e) => setProfile({ ...profile, gpsEnabled: e.target.checked })}
          />
          <span className='text-left'>Enable GPS for real-time location during emergencies</span>
        </label>
      </section>

      {/* Household */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-primary text-left mb-2">Household Composition</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Companions */}
          <div>
            <label className="block mb-2 font-medium text-primary text-left">Number of Companions</label>
            <input
              type="number"
              min="0"
              placeholder="Enter number"
              className="input w-full"
              value={profile.householdSize}
              onChange={(e) => setProfile({ ...profile, householdSize: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>

          {/* Column 2: Checklist */}
          <div className="space-y-2">
            <label className="block font-medium text-primary mb-2 text-left">Household Details</label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={profile.hasChildren}
                onChange={(e) => setProfile({ ...profile, hasChildren: e.target.checked })}
              />
              <span>Children present</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={profile.hasElderly}
                onChange={(e) => setProfile({ ...profile, hasElderly: e.target.checked })}
              />
              <span>Elderly present</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={profile.hasPWD}
                onChange={(e) => setProfile({ ...profile, hasPWD: e.target.checked })}
              />
              <span>Persons with disabilities</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={profile.hasPets}
                onChange={(e) => setProfile({ ...profile, hasPets: e.target.checked })}
              />
              <span>Pets in household</span>
            </label>
          </div>

          {/* Column 3: Medical Needs */}
          <div>
            <label className="block mb-2 font-medium text-primary text-left">Medical Needs or Mobility Concerns</label>
            <textarea
              placeholder="Describe any medical needs or mobility concerns"
              className="input w-full h-24 resize-none"
              value={profile.medicalNeeds}
              onChange={(e) => setProfile({ ...profile, medicalNeeds: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <button
        type="submit"
        className="mt-1 w-full bg-primary text-white py-2 px-4 rounded hover:bg-highlight transition"
      >
        Save Profile
      </button>
    </form>
  );
}