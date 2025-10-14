import { SpecifyVehicle } from "../components/emergency-sos/OtherVehicle";
import { NavbarB } from "../components/Navbar_2";

export const OtherVehicles = () => {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavbarB />
      </div>

      {/* Main content below navbar */}
      <main className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <SpecifyVehicle />
      </main>
    </div>
  );
};
