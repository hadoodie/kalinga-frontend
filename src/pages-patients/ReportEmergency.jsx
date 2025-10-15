import { EmergencyReport } from "../components/emergency-sos/Report";
import { NavbarB } from "../components/Navbar_2";

export const ReportEmergencies = () => {
  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <NavbarB />
      </div>

      {/* Main content below navbar */}
      <main className="overflow-hidden">
        <EmergencyReport />
      </main>
    </div>
  );
};
