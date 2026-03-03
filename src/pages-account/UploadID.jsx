import { Footer } from "../components/Footer";
import { NavbarA } from "../components/Navbar_1";
import UploadID from "../components/verify-accs/UploadID";

export const UploadIDs = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* Upload ID */}
            <UploadID />

            {/* Footer */}
            <Footer />
        </div>
    </div>
    );
}