import { SpecifyVehicle } from "../components/emergency-sos/OtherVehicle";
import { NavbarB } from "../components/Navbar_2";


export const OtherVehicles = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* Vechicle Selection */}
            <SpecifyVehicle />

        </div>
    </div>
    );
}