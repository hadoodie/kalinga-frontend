import { ChatReport } from "../components/emergency-sos/Chat";
import { NavbarB } from "../components/Navbar_2";


export const EmergencyChat = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
              {/* Navbar*/}
              <NavbarB />
        
              {/* Talk to responders */}
              <main className="pt-20"> 
                <ChatReport />
              </main>
        </div>
    </div>
    );
}