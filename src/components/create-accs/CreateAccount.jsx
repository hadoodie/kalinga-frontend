import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { navigateToRoleBasedRoute, getPostAuthDescription } from "../../utils/roleRouting";

export default function CreateAcc() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordStrong = (pwd) => {
    const minLength = /.{8,}/;
    const hasLetters = /[A-Za-z]/;
    const hasNumbers = /[0-9]/;
    return minLength.test(pwd) && hasLetters.test(pwd) && hasNumbers.test(pwd);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordStrong(password)) {
      setError("Password must be at least 8 characters long and contain letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Register user with backend API
      const data = await register({
        name: formData.name,
        email: formData.email,
        password: password,
        password_confirmation: confirmPassword,
        role: "patient", // Default role for self-registration
        phone: formData.phone || null,
      });

      // Show success toast
      const description = getPostAuthDescription(data.user.role, data.user);
      toast({
        title: "Account created!",
        description: `Welcome, ${data.user.name}! ${description}`,
        className: "flex flex-col items-center text-center justify-center w-full",
      });

      // User is now automatically logged in (AuthContext handles this)
      // Redirect based on role using centralized routing
      navigateToRoleBasedRoute(data.user, navigate, { delay: 1500 });

    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific error messages
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(" ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (password && value && password !== value) {
      setError("Passwords do not match!");
    } else {
      setError("");
    }
  };

  return (
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 min-h-screen flex flex-col items-center pt-35 px-4 pb-20">
      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-6 sm:p-8 flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
            Create a new account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-left">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                placeholder="Juan Dela Cruz"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-left">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                placeholder="juan.delacruz@example.com"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1 text-left">
                Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                placeholder="09171234567"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-md border ${
                    password && !isPasswordStrong(password) ? "border-red-500" : "border-input"
                  } bg-background focus:ring-2 focus:ring-primary`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be <span className="font-semibold">8+ characters</span> long and contain both 
                <span className="font-semibold"> letters</span> and <span className="font-semibold">numbers</span>.
              </p>
              {password && !isPasswordStrong(password) && (
                <p className="text-red-500 text-xs mt-1">
                  Password does not meet the requirements
                </p>
              )}
            </div>

            {/* Retype Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1 text-left"
              >
                Retype Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`w-full px-4 py-3 rounded-md border ${
                    error ? "border-red-500" : "border-input"
                  } bg-background focus:ring-2 focus:ring-primary`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-xs">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isSubmitting || !password || !confirmPassword || !!error || !isPasswordStrong(password)
              }
              className={`w-full button flex items-center justify-center gap-2 ${
                isSubmitting ||
                !password ||
                !confirmPassword ||
                !!error ||
                !isPasswordStrong(password)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>

            <p className="text-sm text-center mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </form>
      </div>
    </div>
  );
}
