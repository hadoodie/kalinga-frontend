import { useNavigate } from "react-router-dom";
import { Ambulance, Truck } from "lucide-react";

export default function EmergencyVehicleSelection() {
  const navigate = useNavigate();

  const handleSelection = (vehicleType) => {
    if (vehicleType === "Others") {
      navigate("/patient/specify-vehicle");
    } else {
      // TODO: Send vehicle selection to backend
      // After successful submission, navigate to Messages
      navigate("/patient/messages", { state: { filterCategory: "Emergency" } });
    }
  };

  return (
    <section className="h-screen bg-background text-primary flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-8">
        What kind of{" "}
        <span className="text-highlight font-bold">
          emergency response vehicle
        </span>{" "}
        are you requesting?
      </h2>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => handleSelection("Ambulance")}
          className="bg-primary hover:bg-green-950 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-3 transition"
        >
          <Ambulance size={20} /> Ambulance
        </button>

        <button
          onClick={() => handleSelection("Fire Truck")}
          className="bg-primary hover:bg-green-950 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-3 transition"
        >
          <Truck size={20} /> Fire Truck
        </button>

        <button
          onClick={() => handleSelection("Others")}
          className="bg-primary hover:bg-green-950 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-3 transition"
        >
          Others
        </button>
      </div>
    </section>
  );
}
