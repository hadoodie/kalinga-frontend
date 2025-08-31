import { NavbarB } from "../components/Navbar_2";
import FillInfo from "../components/verify-accs/FillInfo";

export const FillInformation = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* Fill Information from the Uploaded ID */}
            <FillInfo />

        </div>
    </div>
    );
}