import { NavbarB } from "../components/Navbar_2";
import VerifyID from "../components/verify-accs/VerifyID";

export const VerifyIDs = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* ID to verify your account */}
            <VerifyID />
        </div>
    </div>
    );
}