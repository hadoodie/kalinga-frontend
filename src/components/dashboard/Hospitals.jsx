import React, { useState } from "react";
import { shelterMapImg } from "@images";

export default function Hospital() {
  const [centerOpen, setCenterOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState("Medical Facilities 1");

  const centerData = {
    "Medical Facilities 1": {
      name: "Baseco Medical Facilities",
      address: "HXR5+4M8, Port Area, Manila, Metro Manila",
      contact: "+0991 052 6395",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "201",
      available: "299",
      distance: "4 km",
      status: "AVAILABLE",
      resources: {
        Food: { distribution: "Tomorrow, 8:00 AM" },
        Water: { distribution: "Today, 3:00 PM" },
        Medicine: { distribution: "On request at clinic" },
        "First Aid Kits": { distribution: "On request at clinic" },
        "Hygiene Kits": { distribution: "Every 2 days, 10:00 AM" },
        "Blankets & Mats": { distribution: "Ask shelter staff" },
        "Pet Supplies": { distribution: "On request at clinic" },
      },
    },
    "Medical Facilities 2": {
      name: "Delpan Medical Facilities",
      address: "Manila, Metro Manila",
      contact: "+(02) 8241 4165",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "98",
      available: "102",
      distance: "21 km",
      resources: {
        Food: { distribution: "Tomorrow, 8:00 AM" },
        Water: { distribution: "Today, 3:00 PM" },
        Medicine: { distribution: "On request at clinic" },
        "First Aid Kits": { distribution: "On request at clinic" },
        "Hygiene Kits": { distribution: "Ask shelter staff" },
        "Blankets & Mats": { distribution: "Ask shelter staff" },
        "Infant Supplies": { distribution: "On request at clinic" },
        "Pet Supplies": { distribution: "On request at clinic" },
      },
    },
    "Medical Facilities 3": {
      name: "Mandaluyong Medical Facilities ",
      address: "H38F+84V, Pasig, Metro Manila",
      contact: "+6390 000 0000",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "100",
      available: "0",
      distance: "1.2 km",
      resources: {
        Food: { distribution: "Tomorrow, 7:00 AM" },
        Water: { distribution: "Today, 3:00 PM" },
        Medicine: { distribution: "On request at clinic" },
        "First Aid Kits": { distribution: "On request at clinic" },
        "Hygiene Kits": { distribution: "Every 2 days, 10:00 AM" },
        "Blankets & Mats": { distribution: "Ask shelter staff" },
      },
    },
  };

  const center =
    centerData[selectedCenter] || centerData["Medical Facilities 1"];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[3fr_5fr] gap-3">
      {/* LEFT SIDE (Details, population, resources) */}
      <div className="flex flex-col gap-3">
        <div className="bg-none min-h-[60px] rounded-md">
          <div className="flex flex-row justify-between">
            <h1 className="text-3xl font-bold text-[#1A4718]">
              Medical Facilities
            </h1>
            <div className="relative inline-block">
              <button
                className="bg-[#f0d003] text-white border-none text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer mt-0 hover:bg-[#2c6b25]"
                onClick={() => setCenterOpen(!centerOpen)}
              >
                {selectedCenter} ▼
              </button>

              {centerOpen && (
                <ul className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded-s min-w-[120px] shadow-lg py-2 z-10">
                  {Object.keys(centerData).map((centerKey) => (
                    <li
                      key={centerKey}
                      className="text-[#1A4718] text-sm list-none py-2 px-3 cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        setSelectedCenter(centerKey);
                        setCenterOpen(false);
                      }}
                    >
                      {centerKey}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="text-[15px] mt-1 text-left">
            As of April 25, 2025 11:00 AM
          </p>
        </div>

        <div className="bg-[#1A4718] min-h-[200px] rounded-xl px-4 py-3 text-white flex flex-col justify-start">
          <p className="text-lg font-bold mb-6">Shelter Population</p>
          <div className="flex flex-row items-center justify-around gap-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-5xl font-extrabold leading-none mb-1">
                {center.occupied}
              </h3>
              <p className="text-base font-medium mt-0">Current Evacuees:</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <h3
                className={`text-5xl font-extrabold leading-none mb-1 ${
                  parseInt(center.available) > 0
                    ? "text-[#f0d003]"
                    : "text-white"
                }`}
              >
                {center.available}
              </h3>
              <p className="text-base font-medium mt-0">Available Spaces:</p>
            </div>
          </div>
        </div>

        <div className="bg-none min-h-[340px] rounded-md flex flex-col">
          <h3 className="font-bold text-lg ml-2 mt-1.5 mb-0 text-left">
            Resources and Supplies
          </h3>
          <p className="text-xs font-normal mt-0.5 ml-2 mb-0 text-left">
            See essentials ready at the center.
          </p>
          <div className="grid grid-cols-2 gap-2 bg-none mx-[5px] mt-1 flex-grow overflow-y-auto rounded-md">
            <div className="font-bold text-sm text-white bg-[#1A4718] px-0.5 py-0.5 rounded-sm text-center mt-1.5">
              Category
            </div>
            <div className="font-bold text-sm text-white bg-[#1A4718] px-0.5 py-0.5 rounded-sm text-center mt-1.5">
              Distribution
            </div>
            {Object.entries(center.resources).map(([category, info]) => (
              <React.Fragment key={category}>
                <div className="p-0.5 border-b border-[#f0d003] text-xs text-center">
                  {category}
                </div>
                <div className="p-0.5 border-b border-[#f0d003] text-xs text-center">
                  {info.distribution}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Map) */}
      <div className="bg-green-500 lg:row-span-3 min-h-[270px] relative rounded-xl overflow-hidden">
        <img
          src={shelterMapImg}
          alt="Metro Manila Map"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div
          className="absolute bottom-0 w-full h-[150px] z-10"
          style={{
            background:
              "linear-gradient(to top, #1A4718, rgba(26, 71, 24, 0.7), transparent)",
          }}
        ></div>

        <div className="absolute bottom-4 left-4 z-20 text-sm text-white text-left">
          <p className="text-[11px] font-normal mt-10 md:mt-20 lg:mt-[90px] mb-0 ml-4 lg:ml-[25px]">
            {`Nearest Medical Facilities: ${center.distance} away.`}
          </p>
          <p className="text-xl md:text-2xl font-extrabold mt-0.5 mb-0.5 ml-4 lg:ml-[25px]">
            {center.name}
          </p>
          <p className="text-base font-normal mt-0.5 mb-0.5 ml-4 lg:ml-[25px]">
            {center.address}
          </p>
          <p className="text-base font-normal mt-0.5 mb-0 ml-4 lg:ml-[25px]">
            {center.contact}
          </p>
        </div>
      </div>
    </div>
  );
}
