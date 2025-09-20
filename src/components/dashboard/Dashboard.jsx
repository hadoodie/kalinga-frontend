import { 
  userLocImg, 
  responderImg, 
  newsImg, 
  evacLogoImg, 
  hospitalLogoImg, 
  evacMapImg, 
  walkIconImg, 
  carIconImg } from "@images";
import { useState } from "react";
import { 
  ChevronRight, 
  TriangleAlert } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function Dashboard() {

  const navigate = useNavigate();

  const [selected, setSelected] = useState("All Centers");
  const [selectedScale, setSelectedScale] = useState("Celsius");
  const [selectedOption, setSelectedOption] = useState("Evacuation Center");
  const [scalesOption, setOptionOpen] = useState(false);

  const evacData = {
    "Evacuation Center 1": {
      name: "Baseco Evacuation Center",
      address: "HXR5+4M8, Port Area, Manila, Metro Manila",
      contact: "+0991 052 6395",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "201",
      available: "299",
      distance: "4 km",
      status: "AVAILABLE",
      capacity: "201/500"
    },
    "Evacuation Center 2": {
      name: "Delpan Evacuation Center",
      address: "Manila, Metro Manila",
      contact: "+(02) 8241 4165",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "98",
      available: "2",
      distance: "21 km",
      status: "AVAILABLE",
      capacity: "98/100"
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
      capacity: "100/100"
    },
  };

  const data = {
    condition: "Heavy Rainfall",
    date: "APRIL 25, 2025",
    day: "FRIDAY"
  }

  const weather = {
    city: "Manila",
    condition: "Sunny",
    time: "11:00 AM",
    tempC: "34°C",
    tempF: "84°F",
    wind: "19 mph",
    pop: "40%",
    hum: "19%",
  };

  const hospitalData = {
    "Hospital 1": {
      name: "Manila General Hospital",
      address: "123 Rizal Ave, Manila",
      contact: "+6391 234 5678",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "320",
      available: "80",
      distance: "3.5 km",
      status: "Open",
      traffic: "30 mins",
      nottraffic: "10 mins",
      walking: "35 mins",
      capacity: "Normal",
      waittime: "5 mins",
      traumalevel: "Level 3"
    },
    "Hospital 2": {
      name: "Pasig City Medical Center",
      address: "456 Shaw Blvd, Pasig",
      contact: "+6392 345 6789",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "210",
      available: "40",
      distance: "5.2 km",
      status: "Limited Capacity",
      traffic: "80 mins",
      nottraffic: "30 mins",
      walking: "60 mins",
      capacity: "Crowded",
      waittime: "20 mins",
      traumalevel: "Level 3"
    },
    "Hospital 3": {
      name: "Quezon City Health Complex",
      address: "789 Commonwealth Ave, QC",
      contact: "+6393 456 7890",
      update: "As of April 25, 2025 11:00 AM",
      occupied: "150",
      available: "100",
      distance: "2.1 km",
      traffic: "20 mins",
      nottraffic: "5 mins",
      walking: "15 mins",
      status: "Open",
      capacity: "Normal",
      waittime: "No",
      traumalevel: "Level 2"
    }
  };

  const waterLevel = {
    time: "04-25-2025 11:00 AM",
    value: "8.91  ",
    unit: "meters",
    pointlevel: "Sto. Nino"
  };

  const levelValue = parseFloat(waterLevel.value);
  let levelColor = "text-black";
    if (levelValue >= 0 && levelValue < 5) {
      levelColor = "text-black";
    } else if (levelValue >= 5 && levelValue < 7) {
      levelColor = "text-yellow-600";
    } else if (levelValue >= 7 && levelValue < 8.5) {
      levelColor = "text-orange-600";
    } else if (levelValue >= 8.5) {
      levelColor = "text-red-600";
    }

  let severityLabel = "Normal";
    if (levelValue >= 0 && levelValue < 5) {
      severityLabel = "Safe";
    } else if (levelValue >= 5 && levelValue < 7) {
      severityLabel = "Alert";
    } else if (levelValue >= 7 && levelValue < 8.5) {
      severityLabel = "Warning";
    } else if (levelValue >= 8.5) {
      severityLabel = "Danger";
    }

  const news = {
    headline: "New LPA inside PAR likely to develop into tropical depression",
    photo: newsImg,
    article: "https://www.rappler.com/philippines/weather/lpa-update-pagasa-forecast-august-23-2025-5pm"
  };

  const location = {
    time: "2 mins ago",
    address: "Barangay XYZ, City",
    status: "Pending",
    ID: "123-456-789",
    arrivaltime: "5 mins",
    datesent: "22 Aug 2025",
    timesent: "12:21 AM",
    daterequest: "22 Aug 2025",
    timerequest: "12:21 AM",
    responder: "Dr. Mcdreamy",
    profile: responderImg
  };

  return (
    <div className="flex-1 font-sans w-full p-2 md:p-4 lg:w-[1200px] lg:p-0 mx-auto">
      {/* Top header bar */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[repeat(13,85px)] gap-4 bg-none">
        <div className="col-span-1 lg:col-start-1 lg:col-end-7 items-center">
          <h1 className="mb-0 text-left font-bold text-3xl md:text-4xl lg:text-[40px] ml-1 md:ml-4 lg:ml-[4px]">Need Help Now?</h1>
        </div>
        <div className="col-span-1 lg:col-start-7 lg:col-end-13 bg-white justify-center items-center text-center align-center p-2 rounded-xl md:rounded-3xl lg:rounded-none">
          <span className="text-xl md:text-2xl lg:text-[35px] ml-0 font-bold text-red-700">ALERT: </span>
          <strong className="text-xl md:text-2xl lg:text-[35px]">{data.condition}</strong>
        </div>
      </div>

      {/* Contents */}
      <section className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[repeat(13,85px)] lg:grid-rows-[repeat(13,41px)] gap-4 mt-4">
        {/* Date and Day */}
        <div className="col-span-1 lg:row-start-3 lg:row-end-4 lg:col-start-1 lg:col-end-7 ml-2 md:ml-4 lg:ml-5 text-left rounded-xl">
          <span className="text-xl md:text-2xl lg:text-[35px] font-bold text-[#1A4718]">{data.date}</span>
          <span className="text-base md:text-xl lg:text-[25px] text-[#f0d003] font-bold ml-1 md:ml-2.5 mt-2">{data.day}</span>
        </div>

        {/* Send Alert Button */}
        <button 
        onClick={() => navigate("/report-emergency")}
        className="col-span-1 lg:row-start-1 lg:row-end-3 lg:col-start-1 lg:col-end-4 bg-[#1A4718] mt-2 md:mt-5 rounded-[50px] border-none shadow-none outline-none flex flex-col items-center justify-center gap-1 p-3 transition-all duration-200 ease-in-out hover:bg-[#f0f0f0] hover:shadow-inner hover:translate-y-1 md:hover:translate-y-3">
          <div className="flex flex-col items-center p-1 text-white hover:text-[#1A4718]">
            <h3 className="font-bold text-lg md:text-xl lg:text-[25px] mb-0">SEND ALERT</h3>
            <p className="font-light text-xs md:text-sm lg:text-[15px] mt-0">Call for Action</p>
          </div>
        </button>

        {/* Send Message Button */}
        <button className="col-span-1 lg:row-start-1 lg:row-end-3 lg:col-start-4 lg:col-end-7 bg-[#1A4718] mt-2 md:mt-5 rounded-[50px] border-none shadow-none outline-none flex flex-col items-center justify-center gap-1 p-3 transition-all duration-200 ease-in-out hover:bg-[#f0f0f0] hover:shadow-inner hover:translate-y-1 md:hover:translate-y-3">
          <div className="flex flex-col items-center p-1 text-white hover:text-[#1A4718]">
            <h3 className="font-bold text-lg md:text-xl lg:text-[25px] mb-0">SEND MESSAGE</h3>
            <p className="font-light text-xs md:text-sm lg:text-[15px]">Communicate Immediately</p>
          </div>
        </button>

        {/* Mark Safe Card */}
      <div className="col-span-1 lg:row-start-1 lg:row-end-3 lg:col-start-10 lg:col-end-13 bg-[#1A4718] text-white mb-0 mt-5 md:mt-5 rounded-xl flex flex-col items-start justify-center gap-0 p-4 text-left">
        <div className="flex flex-row items-center justify-start gap-2">
            <h3 className="text-lg md:text-xl lg:text-2xl mb-0 mt-0">Mark yourself </h3>
            <button className="text-[#f0d003] border-none text-xl md:text-3xl lg:text-[25px] font-bold cursor-pointer w-[90px] transition-transform duration-200 hover:scale-125 md:hover:scale-145 ml-[-20px]"> SAFE</button>
        </div>
        <p className="font-light text-sm md:text-base lg:text-[10px] mt-0 lg:mb-[10px]">Update your status so emergency teams can prioritize others in need.</p>
    </div>

        {/* Evacuation/Medical Facilities Card */}
        <div className="col-span-1 lg:row-start-4 lg:row-end-13 lg:col-start-1 lg:col-end-7 bg-white rounded-xl p-4 md:p-6 lg:p-0">
          <div className="flex flex-row justify-between items-center p-4">
            <div className="flex flex-row items-center">
              <img
                src={selectedOption === "Evacuation Center" ? evacLogoImg : hospitalLogoImg}
                alt={selectedOption === "Evacuation Center" ? "Evac Logo" : "Hospital Logo"}
                className="w-8 h-auto md:w-12"
              />
              <div className="flex flex-col ml-2 md:ml-4">
                <h3 className="text-base md:text-xl lg:text-[25px] font-bold">{selectedOption === "Evacuation Center" ? "Evacuation Center" : "Medical Facilities"}</h3>
                <p className="text-xs md:text-sm lg:text-[10px] font-light">{selectedOption === "Evacuation Center" ? "Designated Evacuation Point" : "Nearest Medical Facilities"}</p>
              </div>
            </div>
            <div className="relative inline-block">
              <button
                className="bg-[#f0d003] text-white text-xs md:text-sm lg:text-[13px] font-semibold rounded-[30px] px-2 py-1 md:px-3 hover:bg-[#1A4718] transition-all"
                onClick={() => setOptionOpen(!scalesOption)}
              >
                {selectedOption} ▼
              </button>
              {scalesOption && (
                <ul className="absolute right-0 top-full mt-1 bg-white border-[#1A4718] rounded-lg min-w-[150px] md:min-w-[180px] shadow-lg p-2 z-10">
                  <li
                    className="text-xs py-2 px-3 cursor-pointer hover:bg-[#1A4718] hover:text-white rounded"
                    onClick={() => { setSelectedOption("Evacuation Center"); setOptionOpen(false); }}
                  >
                    Evacuation Center
                  </li>
                  <li
                    className="text-xs py-2 px-3 cursor-pointer hover:bg-[#1A4718] hover:text-white rounded"
                    onClick={() => { setSelectedOption("Hospitals"); setOptionOpen(false); }}
                  >
                    Medical Facilities
                  </li>
                </ul>
              )}
            </div>
          </div>
          {selectedOption === "Evacuation Center" && (
            <>
              <ul className="flex flex-row justify-around items-start list-none p-0 mt-2 md:mt-5">
                {["All Centers", "Evacuation Center 1", "Evacuation Center 2", "Evacuation Center 3"].map((center) => (
                  <li key={center} className="text-xs md:text-sm relative cursor-pointer">
                    <button
                      className={`bg-transparent border-none cursor-pointer text-black ${selected === center ? "text-[#1A4718] font-bold" : ""}`}
                      onClick={() => setSelected(center)}>
                      {center}
                    </button>
                    {selected === center && (
                      <span className="block absolute left-0 bottom-[-5px] h-0.5 w-full bg-black scale-x-100 transition-transform duration-300 ease-in-out"></span>
                    )}
                  </li>
                ))}
              </ul>
              {selected === "All Centers" && <AllCenters evacData={evacData} onSelect={setSelected} />}
              {selected === "Evacuation Center 1" && <EvacuationCenter1 center={evacData["Evacuation Center 1"]} />}
              {selected === "Evacuation Center 2" && <EvacuationCenter2 center={evacData["Evacuation Center 2"]} />}
              {selected === "Evacuation Center 3" && <EvacuationCenter3 center={evacData["Evacuation Center 3"]} />}
            </>
          )}
          {selectedOption === "Hospitals" && (
            <>
              <ul className="flex flex-row justify-around items-start list-none p-0 mt-2 md:mt-5">
                {["All Hospitals", "Hospital 1", "Hospital 2", "Hospital 3"].map((hospital) => (
                  <li key={hospital} className="text-xs md:text-sm relative cursor-pointer">
                    <button
                      className={`bg-transparent border-none cursor-pointer text-black ${selected === hospital ? "text-[#1A4718] font-bold" : ""}`}
                      onClick={() => setSelected(hospital)}>
                      {hospital}
                    </button>
                    {selected === hospital && (
                      <span className="block absolute left-0 bottom-[-5px] h-0.5 w-full bg-black scale-x-100 transition-transform duration-300 ease-in-out"></span>
                    )}
                  </li>
                ))}
              </ul>
              {selected === "All Hospitals" && <AllHospitals hospitalData={hospitalData} onSelect={setSelected} />}
              {selected === "Hospital 1" && <Hospital1 hospital={hospitalData["Hospital 1"]} />}
              {selected === "Hospital 2" && <Hospital2 hospital={hospitalData["Hospital 2"]} />}
              {selected === "Hospital 3" && <Hospital3 hospital={hospitalData["Hospital 3"]} />}
            </>
          )}
        </div>

        {/* Weather Card */}
        <div className="col-span-1 lg:row-start-3 lg:row-end-6 lg:col-start-10 lg:col-end-13 bg-white rounded-xl p-4 flex flex-col">
          <div className="font-bold flex justify-end items-center">
            <div className="text-3xl md:text-4xl lg:text-[40px] mr-1.5 mb-0 text-[#1c2414]">{selectedScale === "Celsius" ? `${weather.tempC}` : `${weather.tempF}`}</div>
            <div className="flex items-center gap-2">
              <button
                className={`transition-transform duration-200 hover:scale-125 md:hover:scale-165 ${selectedScale === "Celsius" ? "font-bold text-[#1A4718]" : "text-gray-600"}`}
                onClick={() => setSelectedScale("Celsius")}
              >
                C
              </button>
              <span className="text-gray-400">|</span>
              <button
                className={`transition-transform duration-200 hover:scale-125 md:hover:scale-165 ${selectedScale === "Fahrenheit" ? "font-bold text-[#1A4718]" : "text-gray-600"}`}
                onClick={() => setSelectedScale("Fahrenheit")}
              >
                F
              </button>
            </div>
          </div>
          <div className="flex flex-row justify-around items-center">
            <div className="text-base md:text-lg lg:text-xl text-[#394e2c]">
              <div className="text-2xl md:text-3xl lg:text-[30px] font-bold text-[#1A4718]">{weather.city}</div>
              <div className="text-xs md:text-sm lg:text-[15px]">{weather.time}</div>
              <div className="text-xs md:text-sm lg:text-[15px]">{weather.condition}</div>
            </div>
            <div className="flex flex-col items-end text-xs md:text-sm lg:text-base font-light">
              <div>Wind: {weather.wind}</div>
              <div>Pop: {weather.pop}</div>
              <div>Hum: {weather.hum}</div>
            </div>
          </div>
        </div>

        {/* Water Level Card */}
        <div className="col-span-1 lg:row-start-6 lg:row-end-8 lg:col-start-10 lg:col-end-13 bg-white rounded-xl p-4 ">
          <div className="flex flex-row justify-between">
            <p className={`text-xs md:text-sm lg:text-[11px] font-bold ${levelColor}`}>{severityLabel} level</p>
            <p className="text-xs md:text-sm lg:text-[11px] font-light">{waterLevel.time}</p>
          </div>
          <h3 className="text-base md:text-lg lg:text-[17px] font-bold mb-1 text-left">Water Level</h3>
          <div className="flex flex-row items-center justify-center">
            <h1 className="text-3xl md:text-4xl lg:text-[33px] font-bold">{waterLevel.value}</h1>
            <div className="flex flex-col ml-2">
              <p className="text-xs md:text-sm lg:text-[12px] mb-0.5 mt-[2px]">{waterLevel.pointlevel}</p>
              <p className="font-bold text-sm md:text-base lg:text-[14px] mt-0"> {waterLevel.unit}</p>
            </div>
          </div>
        </div>

        {/* Latest News Card */}
        <div className="col-span-1 lg:row-start-8 lg:row-end-13 lg:col-start-10 lg:col-end-13 bg-white rounded-xl p-4 flex flex-col">
          <div className="flex flex-row justify-between items-center mb-2">
            <h3 className="font-bold text-xl md:text-2xl lg:text-[25px] text-[#1A4718]">Latest News</h3>
            <a href={news.article} rel="noopener noreferrer" className="cursor-pointer text-2xl md:text-3xl lg:text-[35px] text-[#1A4718] rounded-xl flex items-center justify-center h-8 w-8 hover:bg-[#f0d003] hover:text-[#1A4718] transition-colors"><ChevronRight size={24} /></a>
          </div>
          <p className="text-sm md:text-base lg:text-xs font-normal mb-2">{news.headline}</p>
          <a href={news.article} target="_blank" rel="noopener noreferrer" className="flex-1 overflow-hidden rounded-md">
            <img src={news.photo} alt="News Thumbnail" className="object-cover w-full h-full" />
          </a>
        </div>

        {/* My Location/Request Status Card */}
        <div className="col-span-1 lg:row-start-1 lg:row-end-13 lg:col-start-7 lg:col-end-10 bg-white mt-2 md:mt-5 rounded-xl p-4">
          <div className="flex flex-row justify-between mb-2">
            <h4 className="text-base font-bold">My Location</h4>
            <p className="text-xs font-light">Last updated: {location.time}</p>
          </div>
          <div className="text-sm text-center mb-4">You are currently at {location.address}</div>
          <img src={userLocImg} alt="User Location" className="w-full h-auto max-w-[250px] mx-auto my-4" />
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm">Transaction ID</h4>
            <h5 className="bg-[#f0d003] text-white text-xs font-bold rounded-[30px] px-2 py-1">{location.status}</h5>
          </div>
          <div className="text-xl font-bold text-left">{location.ID}</div>
          <div className="flex items-center text-sm my-2">
            <h3 className="font-normal">Expected Arrival:</h3>
            <p className="font-bold ml-2">{location.arrivaltime}</p>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center text-sm">
              <h3 className="font-normal">{location.datesent}</h3>
              <p className="font-light">{location.timesent}</p>
            </div>
            <div className="text-base font-bold text-left">Request Sent</div>
          </div>
          <div className="flex flex-col mt-2">
            <div className="flex flex-row justify-between items-center text-sm">
              <h3 className="font-normal">{location.daterequest}</h3>
              <p className="font-light">{location.timerequest}</p>
            </div>
            <div className="text-base font-bold text-left">Replied</div>
          </div>
          <div className="flex flex-row bg-gray-200 rounded-[30px] p-2 items-center mt-4">
            <img src={location.profile} alt="Responder Profile" className="rounded-full w-12 h-12" />
            <div className="flex flex-col ml-4">
              <p className="text-xs text-black">Responder</p>
              <h3 className="text-sm text-black font-bold">{location.responder}</h3>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AllCenters({ evacData, onSelect }) {
  const getStatusColorClass = (status) => {
    if (status === 'AVAILABLE') {
      return 'text-[#77905b]';}
      return 'text-red-600';
  };

  return (
    <div className="mt-2.5">
      {Object.entries(evacData).map(([key, center]) => (
        <div key={key} className="mb-4 ml-2 md:ml-[35px] mr-2 md:mr-5 mt-5 p-0.5 border-b border-[#fae526]">
          <div className="text-[10px] text-[#555] text-left">{key}</div>
          <div className="flex flex-row items-center">
            <button className="bg-transparent border-none cursor-pointer text-left hover:text-[#1A4718] hover:translate-y-1" onClick={() => onSelect(key)}>
              <div className="text-base font-bold text-[#1A4718]">{center.name}</div>
            </button>
            <div className={`${getStatusColorClass(center.status)} font-extrabold ml-2`}>- {center.status}</div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-5">
            <div className="mt-1 text-sm md:text-[0.8rem] text-black">
              <p className="mt-0.5 mb-0">{center.address}</p>
              <p className="mt-0.5">{center.contact}</p>
            </div>
            <div className="font-bold">Capacity: {center.available}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvacuationCenter1({ center }) {
  const getAvailabilityColorClass = (available) => {
    return available > 0 ? 'text-[#77905b]' : 'text-red-600';
  };
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{center.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{center.address}</p>
          <p className="mt-0.5">{center.contact}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-xs font-light mt-4 md:mt-[30px] mb-0.5">Updated: {center.update}</p>
          <h3 className="text-base md:text-lg font-normal mt-1 mb-0.5">Shelter Population:</h3>
          <div className="flex flex-row items-center">
            <p className="font-normal text-sm ml-4 md:ml-10 mt-1.5 mb-0.5">Evacuee Count:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.occupied}</h6>
          </div>
          <div className="flex flex-row items-center">
            <p className={`${getAvailabilityColorClass(center.available)} font-bold text-sm ml-4 md:ml-10 mt-1.5 mb-0.5`}>AVAILABLE:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.available}</h6>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Evac Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Evacuation Center: {center.distance} away</p>
        </div>
      </div>
    </>
  );
}

function EvacuationCenter2({ center }) {
  const getAvailabilityColorClass = (available) => {
    return available > 0 ? 'text-[#77905b]' : 'text-red-600';
  };
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{center.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{center.address}</p>
          <p className="mt-0.5">{center.contact}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-xs font-light mt-4 md:mt-[30px] mb-0.5">Updated: {center.update}</p>
          <h3 className="text-base md:text-lg font-normal mt-1 mb-0.5">Shelter Population:</h3>
          <div className="flex flex-row items-center">
            <p className="font-normal text-sm ml-4 md:ml-10 mt-1.5 mb-0.5">Evacuee Count:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.occupied}</h6>
          </div>
          <div className="flex flex-row items-center">
            <p className={`${getAvailabilityColorClass(center.available)} font-bold text-sm ml-4 md:ml-10 mt-1.5 mb-0.5`}>AVAILABLE:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.available}</h6>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Evac Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Evacuation Center: {center.distance} away</p>
        </div>
      </div>
    </>
  );
}

function EvacuationCenter3({ center }) {
  const getAvailabilityColorClass = (available) => {
    return available > 0 ? 'text-[#77905b]' : 'text-red-600';
  };
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{center.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{center.address}</p>
          <p className="mt-0.5">{center.contact}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-xs font-light mt-4 md:mt-[30px] mb-0.5">Updated: {center.update}</p>
          <h3 className="text-base md:text-lg font-normal mt-1 mb-0.5">Shelter Population:</h3>
          <div className="flex flex-row items-center">
            <p className="font-normal text-sm ml-4 md:ml-10 mt-1.5 mb-0.5">Evacuee Count:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.occupied}</h6>
          </div>
          <div className="flex flex-row items-center">
            <p className={`${getAvailabilityColorClass(center.available)} font-bold text-sm ml-4 md:ml-10 mt-1.5 mb-0.5`}>AVAILABLE:</p>
            <h6 className="font-bold text-[15px] mt-1.5 mb-0.5 ml-1.5">{center.available}</h6>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Evac Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Evacuation Center: {center.distance} away</p>
        </div>
      </div>
    </>
  );
}

function AllHospitals({ hospitalData, onSelect }) {
  const getHospitalStatusColorClass = (status) => {
    if (status === 'Open') {
      return 'text-[#77905b]';
    }
    return 'text-red-600';
  };

  return (
    <div className="mt-5">
      {Object.entries(hospitalData).map(([key, hospital]) => (
        <div key={key} className="mb-4 ml-2 md:ml-[30px] mr-2 md:mr-5 mt-5 p-0.5 border-b border-[#fae526]">
          <div className="flex flex-row items-center gap-1.5">
            <div className="text-xs md:text-[10px] text-[#555]">{key} - </div>
            <div className="font-bold text-xs md:text-[12px] mr-2.5 mb-0">{hospital.waittime} average wait time</div>
          </div>
          <div className="flex flex-row items-center">
            <button className="bg-transparent border-none cursor-pointer text-left hover:text-[#1A4718] hover:translate-y-1" onClick={() => onSelect(key)}>
              <div className="text-base font-bold text-[#1A4718]">{hospital.name}</div>
            </button>
            <div className={`${getHospitalStatusColorClass(hospital.status)} font-extrabold ml-2`}>- {hospital.status}</div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-5">
            <div className="mt-0.5 text-sm md:text-[0.8rem] text-black">
              <p className="mt-0.5 mb-0">{hospital.address}</p>
              <p className="mt-0.5">{hospital.contact}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Hospital1({ hospital }) {
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{hospital.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{hospital.address}</p>
          <p className="mt-0.5">{hospital.contact}</p>
          <p className="text-[10px] font-light mt-0.5 mb-0.5 ml-1.5">Updated: {hospital.update}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-sm md:text-[15px] font-bold mt-4 md:mt-[15px]">Travel Time</p>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={carIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.traffic}(traffic) | {hospital.nottraffic}(no traffic)</p>
          </div>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={walkIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.walking} walking</p>
          </div>
          <div className="flex flex-col mt-4">
            <h3 className="text-sm font-bold mb-1.5">Status:</h3>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">ER Capacity: </p>
              <h6 className="text-xs font-bold">{hospital.capacity}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Current Wait Time: </p>
              <h6 className="text-xs font-bold">{hospital.waittime}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Trauma Level: </p>
              <h6 className="text-xs font-bold">{hospital.traumalevel}</h6>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Hospital Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Hospital: {hospital.distance} away</p>
        </div>
      </div>
    </>
  );
}

function Hospital2({ hospital }) {
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{hospital.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{hospital.address}</p>
          <p className="mt-0.5">{hospital.contact}</p>
          <p className="text-[10px] font-light mt-0.5 mb-0.5 ml-1.5">Updated: {hospital.update}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-sm md:text-[15px] font-bold mt-4 md:mt-[15px]">Travel Time</p>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={carIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.traffic}(traffic) | {hospital.nottraffic}(no traffic)</p>
          </div>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={walkIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.walking} walking</p>
          </div>
          <div className="flex flex-col mt-4">
            <h3 className="text-sm font-bold mb-1.5">Status:</h3>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">ER Capacity: </p>
              <h6 className="text-xs font-bold">{hospital.capacity}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Current Wait Time: </p>
              <h6 className="text-xs font-bold">{hospital.waittime}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Trauma Level: </p>
              <h6 className="text-xs font-bold">{hospital.traumalevel}</h6>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Hospital Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Hospital: {hospital.distance} away</p>
        </div>
      </div>
    </>
  );
}

function Hospital3({ hospital }) {
  return (
    <>
      <div className="ml-2 md:ml-[30px] mt-[35px]">
        <h2 className="text-lg md:text-xl font-bold mb-0">{hospital.name}</h2>
        <div className="text-sm font-normal">
          <p className="mt-0.5 mb-0">{hospital.address}</p>
          <p className="mt-0.5">{hospital.contact}</p>
          <p className="text-[10px] font-light mt-0.5 mb-0.5 ml-1.5">Updated: {hospital.update}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-around items-center md:items-start">
        <div className="flex flex-col">
          <p className="text-sm md:text-[15px] font-bold mt-4 md:mt-[15px]">Travel Time</p>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={carIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.traffic}(traffic) | {hospital.nottraffic}(no traffic)</p>
          </div>
          <div className="flex flex-row items-center gap-2.5 text-xs mt-1.5">
            <img src={walkIconImg} className="w-6 h-6 md:w-[25px] md:h-[25px]" />
            <p>{hospital.walking} walking</p>
          </div>
          <div className="flex flex-col mt-4">
            <h3 className="text-sm font-bold mb-1.5">Status:</h3>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">ER Capacity: </p>
              <h6 className="text-xs font-bold">{hospital.capacity}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Current Wait Time: </p>
              <h6 className="text-xs font-bold">{hospital.waittime}</h6>
            </div>
            <div className="flex flex-row gap-1.5">
              <p className="text-xs">Trauma Level: </p>
              <h6 className="text-xs font-bold">{hospital.traumalevel}</h6>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <img src={evacMapImg} alt="Hospital Map" className="w-[180px] h-auto md:w-[250px] object-contain mb-2.5" />
          <p className="text-xs font-light text-center">Nearest Hospital: {hospital.distance} away</p>
        </div>
      </div>
    </>
  );
}