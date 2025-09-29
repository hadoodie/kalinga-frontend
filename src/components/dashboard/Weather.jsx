import { useState } from "react";
import { 
  MapPin, 
  Thermometer, 
  Sun, 
  SunDim, 
  SunMedium, 
  Wind, 
  Droplets} from 'lucide-react';
import { 
  rainIconImg, 
  mildIconImg, 
  drizzleIconImg, 
  sunnyIconImg, 
  windyIconImg, 
  stormImg, 
  weatherMapImg } from '@images';

export default function WeatherSection() {
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("City");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScale, setSelectedScale] = useState("Celsius");

  const cities = [
    "Caloocan City", "Las Piñas City", "Makati City", "Malabon City",
    "Mandaluyong City", "Manila", "Marikina City", "Muntinlupa City",
    "Navotas City", "Parañaque City", "Pasay City", "Pasig City",
    "Quezon City", "San Juan City", "Taguig City", "Valenzuela City"
  ];

   const defaultDate = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const cityWeatherData = {
    "Makati City": {
      date: defaultDate,
      tempC: "28°C",
      tempF: "82°F",
      condition: "Heavy Rain",
      precipitation: "80%",
      humidity: "92%",
      feelsLikeC: "31°C",
      feelsLikeF: "61°F",
      uv: "1",
      sunrise: "5:45",
      sunset: "6:31",
      day: "13 hr 2 min",
      wind: "8 km/h",
      direction: "180° S",
      gusts: "12 km/h",
      hourly: [
        { hour: "Now", icon: rainIconImg, percent: "60%", tempC: "21°C", tempF: "61°F" },
        { hour: "1PM", icon: mildIconImg, percent: "50%", tempC: "23°C", tempF: "63°F" },
        { hour: "2PM", icon: mildIconImg, percent: "30%", tempC: "19°C", tempF: "69°F" },
        { hour: "3PM", icon: rainIconImg, percent: "50%", tempC: "30°C", tempF: "80°F" },
        { hour: "4PM", icon: mildIconImg, percent: "50%", tempC: "21°C", tempF: "81°F" },
        { hour: "5PM", icon: mildIconImg, percent: "40%", tempC: "28°C", tempF: "48°F" },
        { hour: "6PM", icon: mildIconImg, percent: "30%", tempC: "27°C", tempF: "57°F" },
      ],
      tomCondition: "Thunderstorm",
      tomTempC: "26°C",
      tomTempF: "°F",
    },
    "Manila": {
      date: defaultDate,
      tempC: "31°C",
      tempF: "81°F",
      condition: "Rainy",
      precipitation: "80%",
      humidity: "92%",
      visibility: "10 km",
      feelsLikeC: "30°C",
      feelsLikeF: "60°F",
      uv: "5",
      sunrise: "5:45",
      sunset: "6:31",
      day: "13 hr 2 min",
      wind: "8 km/h",
      direction: "180° S",
      gusts: "12 km/h",
      hourly: [
        { hour: "Now", icon: rainIconImg, percent: "50%", tempC: "30°C", tempF: "80°F" },
        { hour: "1PM", icon: mildIconImg, percent: "50%", tempC: "30°C", tempF: "80°F" },
        { hour: "2PM", icon: mildIconImg, percent: "50%", tempC: "29°C", tempF: "79°F" },
        { hour: "3PM", icon: rainIconImg, percent: "60%", tempC: "28°C", tempF: "78°F" },
        { hour: "4PM", icon: mildIconImg, percent: "60%", tempC: "28°C", tempF: "78°F" },
        { hour: "5PM", icon: mildIconImg, percent: "40%", tempC: "30°C", tempF: "80°F" },
        { hour: "6PM", icon: mildIconImg, percent: "60%", tempC: "27°C", tempF: "77°F" },
      ],
      tomCondition: "Thunderstorm",
      tomTempC: "31°C",
      tomTempF: "81°F",
    },
  };

  const weather = cityWeatherData[selectedCity] || {
    date: defaultDate,
    tempC: "10°C",
    tempF: "50°F",
    condition: "Heavy Rain",
    precipitation: "80%",
    humidity: "92%",
    feelsLikeC: "35°C",
    feelsLikeF: "85°F",
    uv: "10",
    sunrise: "5:45",
    sunset: "6:31",
    day: "13 hr 2 min",
    wind: "6 km/h",
    direction: "180° S",
    gusts: "12 km/h",
    hourly: [
        { hour: "Now", icon: mildIconImg, percent: "10%", tempC: "31°C", tempF: "81°F" },
        { hour: "1PM", icon: drizzleIconImg, percent: "10%", tempC: "30°C", tempF: "80°F" },
        { hour: "2PM", icon: drizzleIconImg, percent: "10%", tempC: "29°C", tempF: "79°F" },
        { hour: "3PM", icon: drizzleIconImg, percent: "20%", tempC: "30°C", tempF: "80°F" },
        { hour: "4PM", icon: mildIconImg, percent: "20%", tempC: "31°C", tempF: "81°F" },
        { hour: "5PM", icon: mildIconImg, percent: "10%", tempC: "30°C", tempF: "80°F" },
        { hour: "6PM", icon: drizzleIconImg, percent: "10%", tempC: "29°C", tempF: "79°F" },
      ],
    tomCondition: "Rain",
    tomTempC: "32°C",
    tomTempF: "82°F",
  };

  const getUvDetails = (uv) => {
  const uvValue = parseInt(uv); 
  if (uvValue <= 2) {
    return { uvLevel: "Low", uvColor: "yellow", uvIcon: SunDim };
  } else if (uvValue <= 5) {
    return { uvLevel: "Moderate", uvColor: "orange", uvIcon: SunMedium };
  } else {
    return { uvLevel: "High", uvColor: "red", uvIcon: Sun };
  }
  };

  const { uvLevel, uvColor, uvIcon } = getUvDetails(weather.uv);
  const UVIcon = uvIcon;

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[5fr_3fr] gap-4 w-full h-full rounded-lg max-w-7xl">
      <div className="grid grid-cols-1 md:grid-rows-2 gap-4">

        <div className="bg-[#1A4718] rounded-lg md:p-6 sm:p-4 flex flex-col p-4"> 
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                className="bg-[#f0d003] rounded-2xl text-black border-none font-bold py-1 px-2 cursor-pointer hover:bg-[#163a14]"
                onClick={() => setCityOpen(!cityOpen)} >
                <div className="flex flex-row items-center gap-1">
                  <MapPin size={15} /> {selectedCity}
                </div>
              </button>
              {cityOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#1A4718] rounded-lg min-w-[180px] shadow-lg p-2 z-10">
                  <input
                    type="text"
                    className="w-full py-1.5 px-2.5 border-none border-b border-gray-300 text-sm outline-none"
                    placeholder="Search city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} />
                  <ul className="max-h-52 overflow-y-auto scrollbar-none m-0 p-0">
                    {filteredCities.map((city) => (
                      <li key={city} className="text-[#1A4718] text-sm list-none py-2 px-3 cursor-pointer hover:bg-[#f0d003]" onClick={() => { setSelectedCity(city); setCityOpen(false); setSearchTerm(""); }} >  {city} </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <div className="bg-[#163a14] rounded-full flex w-[80px] h-[36px] p-1 relative shadow-md">
                <button
                  className={`w-1/2 h-full text-sm font-bold rounded-full z-10 ${
                    selectedScale === "Fahrenheit"
                      ? "bg-[#f0d003] text-[#1A4718]"
                      : "hover:bg-gray-200 text-white"  }`}
                  onClick={() => setSelectedScale("Fahrenheit")}> F
                </button>
                <button
                  className={`w-1/2 h-full text-sm font-bold rounded-full z-10 ${
                    selectedScale === "Celsius"
                      ? "bg-[#f0d003] text-[#1A4718]"
                      : "hover:bg-gray-200 text-white"  }`}
                  onClick={() => setSelectedScale("Celsius")}>  C
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col mt-2">
              <p className="text-xl sm:text-[30px] font-normal text-white mt-4 mb-0"> Weather Forecast</p>
              <p className="text-base sm:text-[20px] font-light text-white mt-0">{weather.date}</p>
              <h3 className="text-6xl sm:text-[80px] font-extrabold mt-5 text-[white] mb-0">{selectedScale === "Celsius" ? weather.tempC : weather.tempF}</h3>
              <h4 className="text-2xl sm:text-[40px] text-white mt-0">{weather.condition}</h4>
            </div>
            <img src={stormImg} className="w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]" alt="Weather Icon" />
          </div>
        </div>

        <div className="bg-[#1A4718] grid grid-cols-1 md:grid-cols-[8fr_3fr] md:grid-rows-[6fr_3fr] gap-3 rounded-lg p-4">
          <div className="bg-none rounded-lg">
            <h3 className="text-sm sm:text-[18px] text-white mb-1">Hourly Forecast</h3> 
            <p className="text-xs font-normal text-white mb-3">{weather.condition} conditions will continue for the rest of the day. Wind gusts are up to {weather.gusts}.</p>
            <div className="flex flex-row items-center justify-start overflow-x-auto gap-2 sm:gap-5 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {weather.hourly.map((entry, index) => (
                <div key={index} className="flex flex-col flex-shrink-0 p-2 gap-1 bg-[#112c10] border border-gray-500 rounded-[30px] items-center text-white w-[60px] sm:w-auto">
                  <p className="text-sm sm:text-base font-bold text-center">{entry.hour}</p>
                  <img src={entry.icon} alt="Weather Icon" className="w-[30px] h-auto sm:w-[45px] mt-0 mb-0" />
                  <p className="text-xs font-bold text-[#f0d003]">{entry.percent}</p>
                  <p className="text-sm sm:text-base font-bold mt-auto">{selectedScale === "Celsius" ? entry.tempC : entry.tempF}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#112c10] rounded-lg md:row-span-2 space-y-4 sm:space-y-6"> 
            <div className="text-white p-4 space-y-2   sm:space-y-8">
              <div className="flex flex-col">
                <p className="text-base sm:text-[20px]">Sunrise</p>
                <div className="flex flex-row justify-between items-center">
                  <p className="text-2xl sm:text-[35px]">{weather.sunrise}</p>
                  <p className="text-2xl sm:text-[35px]">AM</p>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-base sm:text-[20px]">Sunset</p>
                <div className="flex flex-row justify-between items-center">
                  <p className="text-2xl sm:text-[35px]">{weather.sunset}</p>
                  <p className="text-2xl sm:text-[35px]">PM</p>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-base sm:text-[20px]">Day Length</p>
                <p className="text-xl sm:text-[30px]">{weather.day}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#112c10] rounded-lg ">
            <div className="flex flex-row p-2 items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-base sm:text-[20px] text-white">Tomorrow</p>
                <p className="text-xs sm:text-[15px] text-white">{weather.tomCondition}</p>
              </div>
              <div className="flex flex-row items-center gap-4 sm:gap-7">
                <p className="text-3xl sm:text-[50px] font-bold text-white">{selectedScale === "Celsius" ? weather.tomTempC : weather.tomTempF}</p>
                <img src={rainIconImg} className="w-[50px] h-[50px] sm:w-[90px] sm:h-[90px]" alt="Rain Icon" /> 
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-rows-[5fr_3fr] gap-4 min-h-[600px]">
        <div className="bg-[#1A4718] rounded-lg p-4 text-white flex flex-col gap-4">
          <h2 className="text-base sm:text-[18px]">Today’s Highlight</h2>
          <div className="grid grid-cols-2 gap-3 justify-center">
            <div className="bg-[#112c10] rounded-xl w-full sm:w-[200px] min-h-[140px] sm:min-h-[180px] p-3 mx-auto">
              <p className="text-xs sm:text-[15px]">Feels Like</p>
              <div className="flex flex-col justify-center items-center gap-1 sm:gap-2">
                <Thermometer size={50} className="sm:size-[90px]"/> 
                <p className="text-base sm:text-[20px]">{selectedScale === "Celsius" ? weather.feelsLikeC : weather.feelsLikeF}</p>
              </div>
            </div>
          
            <div className="bg-[#112c10] rounded-xl w-full sm:w-[200px] min-h-[140px] sm:min-h-[180px] p-3 mx-auto">
              <p className="text-xs sm:text-[15px]">UV Index</p>
              <div className="flex flex-col items-center justify-center flex-grow">
                <UVIcon size={50} className="sm:size-[90px]" color={uvColor} /> 
                <p className="text-xs sm:text-[15px]">{weather.uv}</p>
                <p className="text-xs sm:text-[15px]">{uvLevel}</p>
              </div>
            </div>
            
            <div className="bg-[#112c10] rounded-xl w-full sm:w-[200px] min-h-[140px] sm:min-h-[180px] p-3 mx-auto">
              <p className="text-xs sm:text-[15px]">Wind Speed</p>
              <div className="flex flex-col justify-center items-center gap-1 sm:gap-2 flex-grow">
                <Wind size={50} className="sm:size-[90px]"/>
                <p className="text-base sm:text-[20px]">{weather.wind}</p>
              </div>
            </div>
            
            <div className="bg-[#112c10] rounded-xl w-full sm:w-[200px] min-h-[140px] sm:min-h-[180px] p-3 mx-auto">
              <p className="text-xs sm:text-[15px]">Humidity</p>
              <div className="flex flex-col justify-center items-center gap-1 sm:gap-2 flex-grow">
                <Droplets size={50} className="sm:size-[90px]"/> 
                <p className="text-base sm:text-[20px]">{weather.humidity}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden h-[200px] md:h-auto"> 
          <div className="w-full h-full">
            <img src={weatherMapImg} alt="Map" className="w-full h-full object-cover"/>
          </div>
        </div>
      </div>
    </div>
  )
}