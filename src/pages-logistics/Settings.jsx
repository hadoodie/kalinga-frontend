import { Footer } from "../components/Footer";
import LogisticSidebar from "../components/logistics/LogiSide";
import LogisSettings from "../components/logistics/SettingsLogistics";
import { NavbarB } from "../components/Navbar_2";

export const SettingsLogistics = () => {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <LogisticSidebar />

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        {/* Navbar*/}
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto ">
          <LogisSettings />
          <Footer />
        </main>
      </div>
    </div>
  );
};
