import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FillInfo() {
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    idNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    province: "",
    city: "",
    barangay: "",
    zipCode: "",
    houseStreet: "",
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (
      !formData.idNumber ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.contactNumber ||
      !formData.birthMonth ||
      !formData.birthDay ||
      !formData.birthYear
    ) {
      setError("Please fill out all required fields before proceeding.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleBack = (e) => {
    e.preventDefault();
    if (step === 2) {
      setStep(1);
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.province ||
      !formData.city ||
      !formData.barangay ||
      !formData.zipCode ||
      !formData.houseStreet
    ) {
      setError("Please fill out all required fields before proceeding.");
      return;
    }

    setError("");
    console.log("Submitted:", formData);
    navigate("/#hero");
  };

  const confirmBack = () => {
    setShowModal(false);
    navigate("/upload-id");
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex justify-center items-start pt-35 px-4 pb-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">
          Verify your account
        </h2>

        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-green-700 rounded"></div>
          <div className="h-1 w-8 bg-green-700 rounded"></div>
        </div>

        <h3 className="mb-3 font-semibold">Fill your information</h3>
        <h3 className="font-bold text-left mb-2">ID Information</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              {/* ID Number */}
              <div>
                <label className="text-left block text-sm font-medium mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="100119980101"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Juan"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Francisco"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dela Cruz"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="text-left block text-sm font-medium mb-1">
                  Contact Number
                </label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <span className="bg-gray-200 px-3 py-2 text-sm font-medium">
                    PH +63
                  </span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="9123456789"
                    className="flex-1 px-3 py-2 outline-none"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Birthday */}
              <div>
                <label className="text-left block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Month</option>
                    {months.map((m, i) => (
                      <option key={i} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Address Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    City / Municipality
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Address Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-left block text-sm font-medium mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Address Row 3 */}
              <div>
                <label className="text-left block text-sm font-medium mb-1">
                  House Number & Street Address
                </label>
                <input
                  type="text"
                  name="houseStreet"
                  value={formData.houseStreet}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Leave this page?</h3>
            <p className="text-sm text-gray-600 mb-6">
              If you go back, the information you entered will be lost.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmBack}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-950"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
