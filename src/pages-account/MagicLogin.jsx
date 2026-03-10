import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import authService from "@/services/authService";
import api, { getCsrfCookie } from "@/services/api";
import { useToast } from "@/hooks/use-toast"; 

export const MagicLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { toast } = useToast(); 

  useEffect(() => {
    const processLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      // Immediately strip the token from the browser's address bar to prevent visual leaks
      window.history.replaceState({}, document.title, window.location.pathname);

      try {
        // 1. Immediately save the token
        localStorage.setItem("token", token);

        // 2. FORCE Axios to use this exact token immediately for the next request
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // 3. Ensure we have a fresh CSRF cookie (prevents 419 errors)
        await getCsrfCookie();

        // 4. Now fetch the user data
        const userData = await authService.getCurrentUser();

        // 5. Sync session globally using your AuthContext helper
        setSession(userData, token);

        // 6. Redirect based on the verified role from the API (not the URL param, which is user-controlled)
        const userRole = userData?.role;
        if (userRole === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (userRole === "patient") {
          navigate("/patient/dashboard", { replace: true });
        } else if (userRole === "responder") {
          navigate("/responder/dashboard", { replace: true });
        } else if (userRole === "logistics") {
          navigate("/logistics/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }

      } catch (error) {
        console.error("Magic login failed", error);
        
        // Clean up the invalid token so it doesn't break future normal logins
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"]; 
        
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "This login link has expired or is invalid. Please log in manually.",
        });
        
        navigate("/login", { replace: true });
      }
    };

    processLogin();
  }, [navigate, searchParams, setSession, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-700" />
        <p className="text-lg font-medium text-gray-700">Authenticating your secure link...</p>
      </div>
    </div>
  );
};