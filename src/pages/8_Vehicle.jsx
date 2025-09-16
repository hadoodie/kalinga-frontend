import EmergencyVehicleSelection from "../components/emergency-sos/Vehicle";
import { NavbarB } from "../components/Navbar_2";


export const VehicleSelection = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* Vechicle Selection */}
            <EmergencyVehicleSelection />

        </div>
    </div>
    );
}