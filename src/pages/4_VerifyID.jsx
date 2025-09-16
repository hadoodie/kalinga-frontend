import { NavbarA } from "../components/Navbar_1";
import VerifyID from "../components/verify-accs/VerifyID";
import { Footer } from "../components/Footer";

export const VerifyIDs = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* ID to verify your account */}
            <VerifyID />

            {/* Footer */}
            <Footer />
        </div>
    </div>
    );
}