import { Footer } from "../components/Footer";
import { NavbarA } from "../components/Navbar_1";
import FillInfo from "../components/verify-accs/FillInfo";

export const FillInformation = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* Fill Information from the Uploaded ID */}
            <FillInfo />

            {/* Footer */}
            <Footer />

        </div>
    </div>
    );
}