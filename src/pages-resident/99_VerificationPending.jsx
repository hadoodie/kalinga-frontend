import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { NavbarB } from "../components/Navbar_2";
import { Footer } from "../components/Footer";

export default function VerificationPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getStatusInfo = () => {
    switch (user?.verification_status) {
      case "verified":
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: "Account Verified!",
          message:
            "Your account has been verified. You can now access all features.",
          action: "Go to Dashboard",
          actionRoute: "/dashboard",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "Verification Rejected",
          message:
            "Your verification was rejected. Please review the feedback and resubmit your documents.",
          action: "Resubmit Verification",
          actionRoute: "/verify-id",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "pending":
      default:
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "Verification Pending",
          message:
            "Your verification documents are being reviewed by our admin team. This usually takes 24-48 hours.",
          action: "Check Status",
          actionRoute: null,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case null:
        return {
          icon: <AlertCircle className="w-16 h-16 text-blue-500" />,
          title: "No Verification Submitted",
          message:
            "You have not submitted any verification documents. Please upload your ID to get started.",
          action: "Upload ID",
          actionRoute: "/verify-id",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleAction = () => {
    if (statusInfo.actionRoute) {
      navigate(statusInfo.actionRoute);
    } else {
      // Refresh user data
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <div className="sticky top-0 z-10 bg-background">
        <NavbarB />
      </div>

      {/* Main Content */}
      <main className="flex items-center justify-center p-4 py-16">
        <div className="max-w-md w-full">
          <div
            className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg shadow-lg p-8`}
          >
            <div className="flex flex-col items-center text-center">{/* Icon */}
              <div className="mb-4">{statusInfo.icon}</div>

              {/* Title */}
              <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>

              {/* Message */}
              <p className="text-muted-foreground mb-6">{statusInfo.message}</p>

              {/* User Info */}
              <div className="w-full bg-white rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Account Information</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {user?.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`font-medium ${
                        user?.verification_status === "verified"
                          ? "text-green-600"
                          : user?.verification_status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {user?.verification_status?.toUpperCase() || "PENDING"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3">
                <button
                  onClick={handleAction}
                  className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                >
                  {statusInfo.action}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </div>

              {/* Additional Info for Pending Status */}
              {user?.verification_status === "pending" && (
                <div className="mt-6 text-sm text-muted-foreground">
                  <p className="mb-2">What happens next?</p>
                  <ul className="list-disc list-inside text-left space-y-1">
                    <li>Admin reviews your documents</li>
                    <li>You'll receive an email notification</li>
                    <li>Check back here for status updates</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
