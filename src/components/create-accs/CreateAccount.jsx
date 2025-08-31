import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function CreateAcc() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ password strength (8+ chars, letters + numbers)
  const isPasswordStrong = (pwd) => {
    const minLength = /.{8,}/;
    const hasLetters = /[A-Za-z]/;
    const hasNumbers = /[0-9]/;
    return minLength.test(pwd) && hasLetters.test(pwd) && hasNumbers.test(pwd);
  };

  const handleSubmit = (e) => {
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

    // Simulate API/signup call
    setTimeout(() => {
      toast({
        title: "Account created!",
        description: "Proceed to verify your ID.",
        className: "flex flex-col items-center text-center justify-center w-full",
      });
      setIsSubmitting(false);

      // ✅ Navigate to Verify ID step
      navigate("/verify-id");
    }, 1500);
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
    <div className="bg-gradient-to-b from-green-900 via-green-600 to-yellow-400 px-4 sm:px-6 lg:px-8 pt-18 pb-2">
      <div className="min-h-[calc(100svh-5rem)] overflow-y-auto flex justify-center">
        <div className="w-full max-w-md my-auto bg-card shadow-lg rounded-xl p-6 sm:p-8">
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
                required
                className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                placeholder="juan.delacruz@example.com"
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
              {password && !isPasswordStrong(password) && (
                <p className="text-red-500 text-xs mt-1">
                  Must be 8+ characters with letters & numbers
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
            {error && <p className="text-red-500 text-sm">{error}</p>}

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

            {/* Link */}
            <p className="text-sm text-center mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
