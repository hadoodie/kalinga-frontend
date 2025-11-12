import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context & Components
import { AuthProvider } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { Toaster } from "./components/ui/toaster";

// Route Modules
import { PublicRoutes } from "./routes/PublicRoutes";
import { AccountRoutes } from "./routes/AccountRoutes";
import { PatientRoutes } from "./routes/PatientRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { ResponderRoutes } from "./routes/ResponderRoutes";
import { LogisticsRoutes } from "./routes/LogisticsRoutes";

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <RealtimeProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              {PublicRoutes()}

              {/* Account Creation Flow */}
              {AccountRoutes()}

              {/* Patient Routes */}
              {PatientRoutes()}

              {/* Admin Routes */}
              {AdminRoutes()}

              {/* Responder Routes */}
              {ResponderRoutes()}

              {/* Logistics Routes */}
              {LogisticsRoutes()}

              {/* 404 Not Found */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-primary mb-4">
                        404
                      </h1>
                      <p className="text-xl text-muted-foreground">
                        Page Not Found
                      </p>
                    </div>
                  </div>
                }
              />
            </Routes>
            </Suspense>
          </RealtimeProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;