import { Footer } from "../components/Footer";
import HospitalForecastDetail from "../components/logistics/forecast-v2/HospitalForecastDetail";
import LogisticSidebar from "../components/logistics/LogiSide";
import { NavbarB } from "../components/Navbar_2";

export const HospitalForecastDetailPage = () => {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <LogisticSidebar />
      <div className="flex flex-col flex-1 transition-all duration-300">
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <HospitalForecastDetail />
          <Footer />
        </main>
      </div>
    </div>
  );
};
