import { useState } from "react";
import { 
    shelterMapImg, 
    peopleIconImg, 
    foodIconImg, 
    cannedIconImg, 
    medkitIconImg, 
    clockIconImg } from "@images";

export default function EvacCenter() {
  const [centerOpen, setCenterOpen] = useState(false);
  const [suppliesOpen, setSuppliesOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState("Evacuation Center 1");
  const [selectedSupply, setSelectedSupply] = useState("First Aid Kit Supplies");

  const centerData = {
    "Evacuation Center 1": {
      name: "Baseco Evacuation center",
      address: "HXR5+4M8, Port Area, Manila, Metro Manila",
      contact: "+0991 052 6395",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "201",
      available: "299",
      distance: "4 km",
      status: "AVAILABLE",
      capacity: "201/500",
      food: "6:00 AM, 11:00 NN, 7:00 PM",
      relief: "Every Monday, 7:00 AM",
      curfew: "9:00 PM - 5:00 AM",
      checkup: "10:00 AM - 2:00 PM",
      resources: {
        Food: { availability: "High", status: "available", distribution: "Tomorrow, 8:00 AM" },
        Water: { availability: "Limited", status: "limited", distribution: "Today, 3:00 PM" },
        Medicine: { availability: "High", status: "available", distribution: "On request at clinic" },
        "First Aid Kits": { availability: "High", status: "available", distribution: "On request at clinic" },
        "Hygiene Kits": { availability: "Running Low", status: "low", distribution: "Every 2 days, 10:00 AM" },
        "Blankets & Mats": { availability: "High", status: "available", distribution: "Ask shelter staff" },
        "Pet Supplies": { availability: "Limited", status: "limited", distribution: "On request at clinic" },
      },
    },
    "Evacuation Center 2": {
      name: "Delpan Evacuation Center",
      address: "Manila, Metro Manila",
      contact: "+(02) 8241 4165",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "98",
      available: "102",
      distance: "21 km",
      status: "AVAILABLE",
      capacity: "98/200",
      food: "8:00 AM, 12:00 NN, 6:00 PM",
      relief: "Every 2 days, 3:00 PM",
      curfew: "9:00 PM - 5:00 AM",
      checkup: "10:00 AM - 2:00 PM",
      resources: {
        Food: { availability: "High", status: "available", distribution: "Tomorrow, 8:00 AM" },
        Water: { availability: "Limited", status: "limited", distribution: "Today, 3:00 PM" },
        Medicine: { availability: "High", status: "available", distribution: "On request at clinic" },
        "First Aid Kits": { availability: "High", status: "available", distribution: "On request at clinic" },
        "Hygiene Kits": { availability: "High", status: "available", distribution: "Ask shelter staff" },
        "Blankets & Mats": { availability: "High", status: "available", distribution: "Ask shelter staff" },
        "Infant Supplies": { availability: "Limited", status: "limited", distribution: "On request at clinic" },
        "Pet Supplies": { availability: "Limited", status: "limited", distribution: "On request at clinic" },
      },
    },
    "Evacuation Center 3": {
      name: "Mandaluyong Evacuation Center ",
      address: "H38F+84V, Pasig, Metro Manila",
      contact: "+6390 000 0000",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "100",
      available: "0",
      distance: "1.2 km",
      status: "FULL",
      capacity: "100/100",
      food: "7:00 AM, 12:00 NN, 7:00 PM",
      curfew: "9:00 PM - 5:00 AM",
      checkup: "10:00 AM - 2:00 PM",
      resources: {
        Food: { availability: "High", status: "available", distribution: "Tomorrow, 7:00 AM" },
        Water: { availability: "High", status: "available", distribution: "Today, 3:00 PM" },
        Medicine: { availability: "Running Low", status: "low", distribution: "On request at clinic" },
        "First Aid Kits": { availability: "High", status: "available", distribution: "On request at clinic" },
        "Hygiene Kits": { availability: "Limited", status: "limited", distribution: "Every 2 days, 10:00 AM" },
        "Blankets & Mats": { availability: "High", status: "available", distribution: "Ask shelter staff" }
      },
    },
  };

  const supplyDataByCenter = {
    "Evacuation Center 1": {
      "First Aid Kit Supplies": [
        { label: "Gauge", quantity: "102 pieces", level: "high", width: "100%" },
        { label: "Bandaids", quantity: "58 packs", level: "low", width: "20%" },
        { label: "Betadine (500ml)", quantity: "56 bottles", level: "limited", width: "60%" },
        { label: "Betadine (1000ml)", quantity: "28 bottles", level: "low", width: "30%" },
        { label: "Tweezers", quantity: "6 pieces", level: "low", width: "5%" },
        { label: "Gloves", quantity: "60 pairs", level: "high", width: "81%" },
      ],
      "Hygiene Kits": [
        { label: "Soap", quantity: "120 bars", level: "high", width: "90%" },
        { label: "Toothbrush", quantity: "75 pieces", level: "low", width: "40%" },
      ],
      "Medicine": [
        { label: "Tylenol", quantity: "50 tablets", level: "low", width: "20%" },
        { label: "Aspirin", quantity: "200 tablets", level: "high", width: "100%" },
        { label: "Imodium", quantity: "50 tablets", level: "moderate", width: "70%" },
        { label: "Bioflu", quantity: "180 tablets", level: "high", width: "100%" },
        { label: "Neozep", quantity: "10 tablets", level: "low", width: "10%" },
        { label: "Tempra", quantity: "10 bottles", level: "limited", width: "5%" }
      ],
      "Pet Supplies": [
        { label: "Waste Bags", quantity: "10 boxes", level: "low", width: "10%" },
        { label: "Dry Pet Food", quantity: "100 pounds", level: "moderate", width: "50%" },
        { label: "Canned Wet Food", quantity: "20 cans", level: "limited", width: "10%" },
      ]
    },
    "Evacuation Center 2": {
      "First Aid Kit Supplies": [
        { label: "Gauge", quantity: "102 pieces", level: "high", width: "100%" },
        { label: "Bandaids", quantity: "58 packs", level: "low", width: "20%" },
        { label: "Betadine (500ml)", quantity: "56 bottles", level: "limited", width: "60%" },
        { label: "Betadine (1000ml)", quantity: "28 bottles", level: "low", width: "30%" },
        { label: "Tweezers", quantity: "6 pieces", level: "low", width: "5%" },
        { label: "Gloves", quantity: "60 pairs", level: "high", width: "81%" },
      ],
      "Hygiene Kits": [
        { label: "Toothpaste", quantity: "80 tubes", level: "limited", width: "60%" },
        { label: "Soap", quantity: "120 bars", level: "high", width: "90%" },
        { label: "Toothbrush", quantity: "75 pieces", level: "low", width: "40%" },
      ],
      "Medicine": [
        { label: "Advil", quantity: "20 tablets", level: "low", width: "20%" },
        { label: "Imodium", quantity: "90 tablets", level: "high", width: "90%" },
        { label: "Bioflu", quantity: "100 tablets", level: "high", width: "100%" },
        { label: "Neozep", quantity: "75 tablets", level: "high", width: "75%" },
        { label: "Tempra", quantity: "50 bottles", level: "moderate", width: "50%" }
      ],
      "Pet Supplies": [
        { label: "Dry Pet Food", quantity: "80 pounds", level: "moderate", width: "40%" },
        { label: "Canned Wet Food", quantity: "10 cans", level: "limited", width: "10%" },
      ]
    },
    "Evacuation Center 3": {
      "First Aid Kit Supplies": [
        { label: "Gauge", quantity: "2 pieces", level: "low", width: "2%" },
        { label: "Bandaids", quantity: "108 packs", level: "high", width: "100%" },
        { label: "Betadine (500ml)", quantity: "56 bottles", level: "limited", width: "60%" },
        { label: "Betadine (1000ml)", quantity: "28 bottles", level: "low", width: "30%" },
        { label: "Tweezers", quantity: "6 pieces", level: "low", width: "5%" },
        { label: "Gloves", quantity: "60 pairs", level: "high", width: "81%" },
      ],
      "Hygiene Kits": [
        { label: "Toothpaste", quantity: "80 tubes", level: "limited", width: "60%" },
        { label: "Soap", quantity: "120 bars", level: "high", width: "90%" },
        { label: "Toothbrush", quantity: "75 pieces", level: "low", width: "40%" },
      ],
      "Medicine": [
        { label: "Imodium", quantity: "10 tablets", level: "low", width: "10%" },
        { label: "Bioflu", quantity: "5 tablets", level: "low", width: "5%" },
        { label: "Neozep", quantity: "10 tablets", level: "low", width: "10%" },
        { label: "Tempra", quantity: "2 bottles", level: "limited", width: "2%" }
      ]
    }
  };

  const center = centerData[selectedCenter] || centerData["Evacuation Center 1"];
  const currentSupplies = supplyDataByCenter[selectedCenter][selectedSupply];
  const occupiedCount = parseInt(center.occupied);
  const availableCount = parseInt(center.available);
  const totalCapacity = occupiedCount + availableCount;
  const occupiedPercentage = totalCapacity > 0 ? (occupiedCount / totalCapacity) * 100 : 0;
  const availablePercentage = totalCapacity > 0 ? (availableCount / totalCapacity) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-0">
      <header className="mt-0">
        <div className="font-sans flex flex-row items-center mt-0 p-0">
          <h1 className="text-2xl font-bold text-[#1A4718] mb-px mt-0">Evacuation Center</h1>
          <div className="relative ml-5">
            <button className="bg-[#1A4718] text-white border-none text-xs font-bold rounded-lg px-3 py-1.5 cursor-pointer mt-0 hover:bg-[#2c6b25]" onClick={() => setCenterOpen(!centerOpen)}>
              {selectedCenter} ▼
            </button>
            {centerOpen && (
              <ul className="absolute top-[30%] left-0 bg-white border border-gray-300 rounded-lg min-w-[120px] shadow-lg py-1 z-10">
                {Object.keys(centerData).map((centerKey) => (
                  <li
                    key={centerKey}
                    className="text-[#1A4718] text-sm list-none py-2 px-3 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      setSelectedCenter(centerKey);
                      setSelectedSupply(Object.keys(supplyDataByCenter[centerKey])[0]);
                      setCenterOpen(false);
                    }}
                  >
                    {centerKey}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-row ml-auto mt-0 hidden lg:flex">
            <p className="font-sans text-base font-normal mr-2">Operating Status: </p>
            <p className={`font-bold ${availableCount === 0 ? "text-red-600" : "text-green-600"}`}>
              {availableCount === 0 ? "FULL" : "AVAILABLE"}
            </p>
          </div>
        </div>
        <p className="text-[13px] font-sans font-light mt-1.5">{center.update}</p>
        <div className="flex flex-row mt-2 lg:hidden">
          <p className="font-sans text-base font-normal mr-2">Operating Status: </p>
          <p className={`font-bold ${availableCount === 0 ? "text-red-600" : "text-green-600"}`}>
            {availableCount === 0 ? "FULL" : "AVAILABLE"}
          </p>
        </div>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-1 md:gap-4 lg:grid-cols-[2fr_1fr_2fr] lg:grid-rows-[2fr_2fr_1fr] gap-4 bg-[#f5f5f5] max-w-[1250px] max-h-[500px] mx-auto p-4 lg:p-2.5">
        <div className="font-sans col-span-1 md:col-span-1 lg:col-span-3 row-span-1">
          <div className="relative rounded-lg overflow-hidden h-48 md:h-64 lg:h-full" style={{
            backgroundImage: `url(${shelterMapImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "8px"
          }}>
            <div className="flex flex-row ml-4 gap-2.5 mb-[30px] pt-4 lg:ml-[25px]">
              <p className="text-xs font-bold bg-[#1A4718] text-white rounded-lg px-1.5 py-0.5 border-none">{selectedCenter}</p>
              <p className="text-xs font-bold border border-[#1A4718] text-[#1A4718] rounded-lg px-1.5 py-0.5">Route</p>
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-[11px] font-normal mt-10 md:mt-20 lg:mt-[90px] mb-0 ml-4 lg:ml-[25px]">{`Nearest Evacuation Center: ${center.distance} away.`}</p>
              <p className="text-xl md:text-2xl font-extrabold mt-0.5 mb-0.5 ml-4 lg:ml-[25px]">{center.name}</p>
              <p className="text-base font-normal mt-0.5 mb-0.5 ml-4 lg:ml-[25px]">{center.address}</p>
              <p className="text-base font-normal mt-0.5 mb-0 ml-4 lg:ml-[25px]">{center.contact}</p>
            </div>
            <div className="absolute top-0 left-0 w-full h-full z-0"></div>
          </div>
        </div>

        <div className="grid col-span-1 md:col-span-1 lg:col-span-1 row-span-1 bg-white rounded-[15px] font-sans text-center">
          <div className="flex flex-row items-center gap-2.5 text-left justify-start ml-4 lg:ml-[15px]">
            <img src={peopleIconImg} alt="People Icon" className="w-[50px] h-auto object-contain" />
            <p className="text-lg font-bold">Shelter Population</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-around">
            <div className="flex flex-col items-center justify-center gap-0.5">
              <h3 className="text-5xl font-bold mt-0 mb-3.5 mr-2.5">{center.occupied}</h3>
              <p className="text-xl font-normal mt-0 mr-10 gap-1.5">Evacuee Count:</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <h3 className="text-5xl font-bold mt-0 mb-3.5 mr-2.5">{center.available}</h3>
              <p className="text-xl font-normal mt-0 mr-10 gap-1.5">Available</p>
            </div>
          </div>
          <div className="mt-5 px-2.5 mb-[18px]">
            <div className="flex h-4 w-full rounded-lg overflow-hidden bg-gray-300">
              <div className="bg-red-600 h-full" style={{ width: `${occupiedPercentage}%` }}></div>
              <div className="bg-green-500 h-full" style={{ width: `${availablePercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid col-span-1 md:col-span-1 lg:col-span-1 row-span-2 bg-white m-0 rounded-[15px] font-sans">
          <h3 className="text-[17px] font-bold ml-[15px] mt-[15px]">Daily Schedule</h3>
          <div className="flex flex-row gap-2.5 items-center">
            <img src={foodIconImg} alt="Food Icon" className="w-[38px] h-[35px] ml-3" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#1A4718] text-[15px] mb-px mt-px">Food Distribution:</h3>
              <p className="text-black text-[10px] mt-px mb-px">{center.food}</p>
            </div>
          </div>
          <div className="flex flex-row gap-2.5 items-center">
            <img src={cannedIconImg} alt="Canned Goods Icon" className="w-[38px] h-[35px] ml-3" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#1A4718] text-[15px] mb-px mt-px">Relief Goods Pick-up:</h3>
              <p className="text-black text-[10px] mt-px mb-px">{center.relief}</p>
            </div>
          </div>
          <div className="flex flex-row gap-2.5 items-center">
            <img src={medkitIconImg} alt="Medkit Icon" className="w-[38px] h-[35px] ml-3" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#1A4718] text-[15px] mb-px mt-px">Medical Checkups:</h3>
              <p className="text-black text-[10px] mt-px mb-px">{center.checkup}</p>
            </div>
          </div>
          <div className="flex flex-row gap-2.5 items-center">
            <img src={clockIconImg} alt="Clock Icon" className="w-[38px] h-[35px] ml-3" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#1A4718] text-[15px] mb-px mt-px">Curfew Hours:</h3>
              <p className="text-black text-[10px] mt-px mb-px">{center.curfew}</p>
            </div>
          </div>
        </div>

        <div className="grid col-span-1 md:col-span-1 lg:col-start-1 lg:row-start-3 row-span-1">
          <div className="flex flex-col md:flex-row lg:flex-row gap-4 lg:gap-[15px] justify-between w-full mt-0">
            <div className="flex-1 bg-[#1A4718] text-white rounded-[15px] border-none flex flex-col justify-between p-2.5">
              <div className="mb-2">
                <h3 className="text-yellow-400 text-sm mt-1.5 ml-4 mb-px">Prohibited Items</h3>
                <p className="text-[10px] ml-4">Stay informed on what's not allowed for safety.</p>
              </div>
              <ul className="list-disc ml-8">
                <li className="text-[10px]">Weapons or sharp objects</li>
                <li className="text-[10px]">Flammable items (gasoline, fireworks, lighters in bulk)</li>
                <li className="text-[10px]">Illegal drugs or substances</li>
                <li className="text-[10px]">Alcoholic beverages</li>
              </ul>
            </div>
            <div className="flex-1 bg-[#1A4718] text-white rounded-[15px] border-none flex flex-col justify-between p-2.5">
              <div className="mb-2">
                <h3 className="text-yellow-400 text-sm mt-1.5 ml-4 mb-px">Services Available</h3>
                <p className="text-[10px] ml-4">Check the facilities and services ready for your needs.</p>
              </div>
              <ul className="list-disc ml-8">
                <li className="text-[10px]">Medical Assistance</li>
                <li className="text-[10px]">Charging Stations</li>
                <li className="text-[10px]">Sanitation Facilities</li>
                <li className="text-[10px]">Sleeping Facilities</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full h-full font-sans p-4 bg-white grid col-span-1 md:col-span-1 lg:col-start-3 lg:row-start-2 lg:row-span-2 rounded-[20px] overflow-y-auto overflow-x-hidden">
          <h3 className="font-bold text-lg ml-2 mt-1.5 mb-0">Resources and Supplies</h3>
          <p className="text-xs font-normal mt-0.5 ml-2 mb-0">See essentials ready at the center. Stay updated on supply status.</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="font-bold text-sm text-white bg-[#2c6b25] px-0.5 py-0.5 rounded-sm text-center mt-1.5">Category</div>
            <div className="font-bold text-sm text-white bg-[#2c6b25] px-0.5 py-0.5 rounded-sm text-center mt-1.5">Availability</div>
            <div className="font-bold text-sm text-white bg-[#2c6b25] px-0.5 py-0.5 rounded-sm text-center mt-1.5">Distribution</div>
            {Object.entries(center.resources).map(([category, info]) => (
              <>
                <div className="p-0.5 border-b border-[#2c6b25] text-xs text-center">{category}</div>
                <div className={`p-0.5 border-b border-[#2c6b25] text-xs text-center font-bold inline-block rounded-sm px-1 ${info.status === 'available' ? 'bg-[#e8f5e9] text-[#1A4718]' : info.status === 'limited' ? 'bg-[#fff8e1] text-[#f9a825]' : info.status === 'low' ? 'bg-[#ffebee] text-[#c62828]' : 'bg-[#fff8e1] text-[#2c6b25]'}`}>{info.availability}</div>
                <div className="p-0.5 border-b border-[#2c6b25] text-xs text-center">{info.distribution}</div>
              </>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded-md font-sans">
            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h4 className="text-base mt-0 mb-1 text-[#1A4718] ml-1">{selectedSupply}</h4>
                <p className="text-xs mb-4 ml-1">Supplies for {center.name}</p>
              </div>
              <div className="relative inline-block">
                <button className="bg-[#2c6b25] text-white border-none text-xs font-bold rounded-lg px-3 py-1.5 cursor-pointer mt-0 hover:bg-[#f0d003] hover:text-[#2c6b25]" onClick={() => setSuppliesOpen(!suppliesOpen)}>
                  {selectedSupply} ▼
                </button>
                {suppliesOpen && (
                  <ul className="absolute top-[30%] left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg min-w-[140px] shadow-lg py-1 z-50">
                    {Object.keys(supplyDataByCenter[selectedCenter]).map((category) => (
                      <li key={category} className="text-center text-xs list-none py-2 px-0.5 cursor-pointer hover:bg-[#f0d003] hover:text-[#2c6b25]"
                        onClick={() => {
                          setSelectedSupply(category);
                          setSuppliesOpen(false);
                        }}>
                        {category}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {currentSupplies.map((item, index) => (
              <div key={index} className="mb-4">
                <label className="text-sm block font-medium mb-1 ml-1 text-gray-800">{item.label}</label>
                <div className="bg-gray-300 h-2.5 rounded-md overflow-hidden">
                  <div className={`h-full rounded-md ${item.level === 'high' ? 'bg-[#4caf50]' : item.level === 'moderate' ? 'bg-[#66bb6a]' : item.level === 'low' ? 'bg-red-600' : 'bg-[#fbc02d]'}`}
                    style={{ width: item.width }}>
                  </div>
                </div>
                <span className="block mt-1 text-sm text-gray-600">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}