import { NavbarB } from "../components/Navbar_2";
import UploadID from "../components/verify-accs/UploadID";

export const UploadIDs = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* Upload ID */}
            <UploadID />
        </div>
    </div>
    );
}