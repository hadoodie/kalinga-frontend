import LogisticSidebar from "../components/logistics/LogiSide";
import { NavbarB } from "../components/Navbar_2";
import Notifs from "../components/Notifications";

export const NotificationsLogistics = () => {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <LogisticSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-background">
          <NavbarB />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <Notifs />
        </main>
      </div>
    </div>
  );
};
