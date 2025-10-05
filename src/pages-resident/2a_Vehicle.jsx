import EmergencyVehicleSelection from "../components/emergency-sos/Vehicle";
import { NavbarB } from "../components/Navbar_2";

export const VehicleSelection = () => {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavbarB />
      </div>

      {/* Main content below navbar */}
      <main className="flex items-center justify-center">
        <EmergencyVehicleSelection />
      </main>
    </div>
  );
};
