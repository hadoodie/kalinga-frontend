// src/pages/Auth/KalingaAuthSystem.jsx
import React, { useState } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Upload,
  Camera,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./KalingaAuthSystem.css";

const KalingaAuthSystem = () => {
  const navigate = useNavigate();

  // top-level step: "login" | "signup" | "verify-id" | "verify-info" | "verify-address"
  const [step, setStep] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // signup / verify fields
    firstName: "",
    lastName: "",
    middleName: "",
    dob: { month: "", day: "", year: "" },
    sex: "",
    userType: "",
    email: "",
    contact: "",
    address: "",
    password: "",
    idType: "",
    idNumber: "",
    province: "",
    city: "",
    barangay: "",
    zip: "",
    house: "",
  });

  const update = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));
  const updateDOB = (field, value) =>
    setForm((p) => ({ ...p, dob: { ...p.dob, [field]: value } }));

  // Demo sign-in logic: navigate to dashboard if correct credentials
  const handleSignIn = (e) => {
    e?.preventDefault();
    if (form.email === "admin@kalinga.ph" && form.password === "1234") {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard");
    } else {
      // if not an existing demo account, start the verification/signup flow:
      setStep("verify-id");
    }
  };

  const handleFinalConfirm = () => {
    // do any final validation or API call here
    localStorage.setItem("isLoggedIn", "true");
    navigate("/dashboard");
  };

  return (
    <div className="auth-root">
      <div className="auth-inner">

        {/* LEFT: big logo + brand (stays mounted so focus isn't lost on inputs) */}
        <div className="auth-left">
          <div className="auth-left-content">
            <img src="/kalinga-logo.svg" alt="KALINGA logo" className="auth-left-logo" />
            <h1 className="auth-brand">KALINGA</h1>
            <p className="auth-tagline">
              <strong>ALISTO</strong> sa bawat sakuna, <strong>TATAG</strong> sa bawat pagbangon.
            </p>
          </div>
        </div>

        {/* RIGHT: forms — switch content by `step` */}
        <div className="auth-right">
          {step === "login" && (
            <div className="auth-card">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="Email"
                autoComplete="username"
              />

              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  className="eye-btn"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="toggle password"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button className="btn-primary" onClick={handleSignIn}>
                Sign in
              </button>

              <div className="small-row">
                <button
                  className="link-btn"
                  onClick={() => alert("Password reset flow here")}
                >
                  Forgot password?
                </button>
              </div>

              <div className="hr" />

              <button
                className="btn-secondary"
                onClick={() => setStep("signup")}
              >
                Create an account
              </button>
            </div>
          )}

          {step === "signup" && (
            <div className="auth-card wide">
              <h2 className="card-heading">Sign Up</h2>

              <div className="grid-3">
                <input
                  className="input small"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
                <input
                  className="input small"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
                <input
                  className="input small"
                  placeholder="Middle Name"
                  value={form.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="grid-3">
                  <select
  className="select"
  value={form.dob.month}
  onChange={(e) => updateDOB("month", e.target.value)}
>
  <option value="" disabled hidden>Month</option>
  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
    <option key={i} value={i + 1}>{m}</option>
  ))}
</select>

                  <select
                    className="select"
                    value={form.dob.day}
                    onChange={(e) => updateDOB("day", e.target.value)}
                  >
                    <option value="" disabled hidden>Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select"
                    value={form.dob.year}
                    onChange={(e) => updateDOB("year", e.target.value)}
                  >
                    <option>Year</option>
                    {Array.from({ length: 80 }, (_, i) => (
                      <option key={i} value={2024 - i}>
                        {2024 - i}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  className="select"
                  value={form.sex}
                  onChange={(e) => update("sex", e.target.value)}
                >
                  <option value="">Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <select
                className="select"
                value={form.userType}
                onChange={(e) => update("userType", e.target.value)}
              >
                <option value="">User Type</option>
                <option value="emergency-responder">Emergency Responder</option>
                <option value="medical-personnel">Medical Personnel</option>
                <option value="coordinator">Emergency Coordinator</option>

              </select>

              <div className="grid-2">
                <input
                  className="input"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Contact Number"
                  value={form.contact}
                  onChange={(e) => update("contact", e.target.value)}
                />
              </div>

              <input
                className="input"
                placeholder="Address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />

              <div className="relative">
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                />
                <button
                  className="eye-btn"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="muted">
                By signing up you agree to our Terms & Privacy.
              </div>

              <div className="grid-2">
                <button
                  className="btn-secondary"
                  onClick={() => setStep("login")}
                >
                  Already have an account?
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep("verify-id")}
                >
                  Create an account
                </button>
              </div>
            </div>
          )}

          {step === "verify-id" && (
            <div className="auth-card">
              <h2 className="card-heading">Verify your account</h2>
              <label className="label">Accepted IDs</label>
              <div className="relative">
                <select
                  className="select"
                  value={form.idType}
                  onChange={(e) => update("idType", e.target.value)}
                >
                  <option value="">Choose ID</option>
                  <option>PRC ID</option>
                  <option>Driver's License</option>
                  <option>Passport</option>
                  <option>Postal ID</option>
                  <option>PhilHealth ID</option>
                </select>
                <ChevronDown className="chev" />
              </div>

              <div className="space-y">
                <button className="btn-primary">
                  <Upload className="ico" /> Upload File
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setStep("verify-info")}
                >
                  <Camera className="ico" /> Scan your ID
                </button>
              </div>
            </div>
          )}

          {step === "verify-info" && (
            <div className="auth-card wide">
              <h2 className="card-heading">Verify your account</h2>
              <div className="muted">Fill your information</div>

              <input
                className="input"
                placeholder="ID Number"
                value={form.idNumber}
                onChange={(e) => update("idNumber", e.target.value)}
              />

              <div className="grid-3">
                <input
                  className="input small"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
                <input
                  className="input small"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
                <input
                  className="input small"
                  placeholder="Middle Name"
                  value={form.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                />
              </div>

              <input
                className="input"
                placeholder="Contact Number"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
              />

              <div className="grid-3">
                <select
                  className="select"
                  value={form.dob.month}
                  onChange={(e) => updateDOB("month", e.target.value)}
                >
                  <option>Month</option>
                  {[
                    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                  ].map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  value={form.dob.day}
                  onChange={(e) => updateDOB("day", e.target.value)}
                >
                  <option>Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  value={form.dob.year}
                  onChange={(e) => updateDOB("year", e.target.value)}
                >
                  <option>Year</option>
                  {Array.from({ length: 80 }, (_, i) => (
                    <option key={i} value={2024 - i}>
                      {2024 - i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <button
                  className="btn-secondary"
                  onClick={() => setStep("verify-id")}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep("verify-address")}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === "verify-address" && (
            <div className="auth-card wide">
              <h2 className="card-heading">Verify your account</h2>
              <div className="muted">Fill your information</div>

              <div className="grid-2">
                <input
                  className="input"
                  placeholder="Province"
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="City/Municipality"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>

              <div className="grid-2">
                <input
                  className="input"
                  placeholder="Barangay"
                  value={form.barangay}
                  onChange={(e) => update("barangay", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Zip Code"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                />
              </div>

              <input
                className="input"
                placeholder="House Number and Street Address"
                value={form.house}
                onChange={(e) => update("house", e.target.value)}
              />

              <div className="grid-2">
                <button
                  className="btn-secondary"
                  onClick={() => setStep("verify-info")}
                >
                  Back
                </button>
                <button className="btn-primary" onClick={handleFinalConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KalingaAuthSystem;