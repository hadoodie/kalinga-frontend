import { EmergencyReport } from "../components/emergency-sos/Report";
import { NavbarB } from "../components/Navbar_2";

export const ReportEmergencies = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar*/}
      <NavbarB />

      {/* Report Emergency */}
      <main className="pt-3"> 
        <EmergencyReport />
      </main>
    </div>
  );
};
