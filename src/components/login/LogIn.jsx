import { useState } from "react";
import logo from "../../assets/kalinga-logo.png";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

export default function LogInPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: "Signed In",
        description: "Welcome back to Kalinga!",
        className:
          "flex flex-col items-center text-center justify-center w-full",
      });

      setIsSubmitting(false);
      navigate("/report-emergency");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* Left Column (Logo + Branding) */}
        <div className="hidden md:flex flex-col items-center text-center px-4">
          <img
            src={logo}
            alt="Kalinga Logo"
            className="w-28 sm:w-36 md:w-40 lg:w-48 h-auto mb-6"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-2 bg-gradient-to-r from-lime-400 to-green-950 bg-clip-text text-transparent">
            KALINGA
          </h1>
          <p className="text-base sm:text-lg md:text-lg text-muted-foreground max-w-md">
            ALISTO sa bawat sakuna <br /> TATAG sa bawat pagbangon
          </p>
        </div>

        {/* Right Column (Sign In Form in Card) */}
        <div className="w-full max-w-md mx-auto bg-card shadow-lg rounded-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Log In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-left"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1 text-left"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full button flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="mt-3 text-center">
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <hr className="flex-grow border-border" />
            <span className="text-muted-foreground text-sm">or</span>
            <hr className="flex-grow border-border" />
          </div>

          {/* Create Account */}
          <Link 
            to="/create-acc" 
            className="w-full bg-secondary text-primary hover:bg-secondary/80 font-bold block text-center py-3 rounded-md"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
