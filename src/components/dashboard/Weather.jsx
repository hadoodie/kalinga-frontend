import { useState } from "react";
import { weatherBgImg, 
    weatherMapImg, 
    rainIconImg, 
    mildIconImg, 
    drizzleIconImg, 
    sunnyIconImg, 
    windyIconImg, 
    sunriseIconImg, 
    sunsetIconImg } from '@images';

export default function WeatherSection() {
  const [selected, setSelected] = useState("5 days");
  const options = ["5 days", "15 days", "30 days"];
  const [scalesOpen, setScalesOpen] = useState(false);
  const [selectedScale, setSelectedScale] = useState("Celsius");
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All Center");
  const [searchTerm, setSearchTerm] = useState("");

  const cities = [
    "Caloocan City", "Las Piñas City", "Makati City", "Malabon City",
    "Mandaluyong City", "Manila", "Marikina City", "Muntinlupa City",
    "Navotas City", "Parañaque City", "Pasay City", "Pasig City",
    "Quezon City", "San Juan City", "Taguig City", "Valenzuela City"
  ];

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      condition: "Sunny",
      precipitation: "80%",
      humidity: "92%",
      visibility: "10 km",
      feelsLikeC: "31°C",
      feelsLikeF: "61°F",
      uv: "5",
      pressure: "1012 mbar",
      rainChance: "10%",
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
        { hour: "7PM", icon: mildIconImg, percent: "10%", tempC: "31°C", tempF: "61°F" },
      ],
      daily: [
        { day: "Sunday, August 17", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Monday, August 18", icon: rainIconImg, condition: "Rain" },
        { day: "Tuesday, August 19", icon: drizzleIconImg, condition: "Rain" },
        { day: "Wednesday, August 20", icon: windyIconImg, condition: "Cloudy" },
        { day: "Thursday, August 21", icon: windyIconImg, condition: "Cloudy" },
        { day: "Friday, August 22", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Saturday, August 23", icon: rainIconImg, condition: "Rain" },
        { day: "Sunday, August 24", icon: drizzleIconImg, condition: "Rain" },
        { day: "Monday, August 25", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, August 26", icon: windyIconImg, condition: "Cloudy" },
        { day: "Wednesday, August 27", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Thursday, August 28", icon: rainIconImg, condition: "Rain" },
        { day: "Friday, August 29", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, August 30", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, August 31", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 1", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, September 2", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Wednesday, September 3", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Thursday, September 4", icon: rainIconImg, condition: "Rain" },
        { day: "Friday, September 5", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, September 6", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, September 7", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 8", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, September 9", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Wednesday, September 10", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Thursday, September 11", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Friday, September 12", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, September 13", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, September 14", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 15", icon: windyIconImg, condition: "Cloudy" },
      ]
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
      pressure: "1012 mbar",
      rainChance: "10%",
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
        { hour: "7PM", icon: mildIconImg, percent: "50%", tempC: "28°C", tempF: "78°F" },
      ],
      daily: [
        { day: "Sunday, August 17", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Monday, August 18", icon: rainIconImg, condition: "Rain" },
        { day: "Tuesday, August 19", icon: drizzleIconImg, condition: "Rain" },
        { day: "Wednesday, August 20", icon: windyIconImg, condition: "Cloudy" },
        { day: "Thursday, August 21", icon: windyIconImg, condition: "Cloudy" },
        { day: "Friday, August 22", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Saturday, August 23", icon: rainIconImg, condition: "Rain" },
        { day: "Sunday, August 24", icon: drizzleIconImg, condition: "Rain" },
        { day: "Monday, August 25", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, August 26", icon: windyIconImg, condition: "Cloudy" },
        { day: "Wednesday, August 27", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Thursday, August 28", icon: rainIconImg, condition: "Rain" },
        { day: "Friday, August 29", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, August 30", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, August 31", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 1", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, September 2", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Wednesday, September 3", icon: rainIconImg, condition: "Heavy Rain with Thunderstorm" },
        { day: "Thursday, September 4", icon: rainIconImg, condition: "Rain" },
        { day: "Friday, September 5", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, September 6", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, September 7", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 8", icon: windyIconImg, condition: "Cloudy" },
        { day: "Tuesday, September 9", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Wednesday, September 10", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Thursday, September 11", icon: sunnyIconImg, condition: "Sunny" },
        { day: "Friday, September 12", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Saturday, September 13", icon: windyIconImg, condition: "Cloudy" },
        { day: "Sunday, September 14", icon: drizzleIconImg, condition: "Light Rain" },
        { day: "Monday, September 15", icon: windyIconImg, condition: "Cloudy" },
      ]
    },
  };

  const weather = cityWeatherData[selectedCity] || {
    tempC: "10°C",
    tempF: "50°F",
    condition: "Storm with Heavy Rain",
    precipitation: "80%",
    humidity: "92%",
    visibility: "15 km",
    feelsLikeC: "35°C",
    feelsLikeF: "85°F",
    uv: "2",
    pressure: "1005 mbar",
    rainChance: "96%",
    wind: "6 km/h",
    direction: "215° SW",
    gusts: "14 km/h",
    hourly: [],
    daily: []
  };

  return (
    // Main container for the weather dashboard, centers content and sets full-screen size
    <div className="w-full h-full min-h-screen flex justify-center items-center font-sans">
      {/* Grid container for the entire layout with defined rows and columns */}
      <div className="grid grid-cols-[3fr_1.5fr_2fr] grid-rows-[250px_220px_180px_100px] gap-2.5 p-5 bg-gray-100 h-full w-full min-h-screen">
        {/* Weather display section with a background image */}
        <div className="col-span-2 row-start-1 row-end-2 bg-cover bg-center rounded-lg" style={{
          backgroundImage: `url(${weatherBgImg})`,
        }}>
          {/* Dropdown for selecting city */}
          <div className="relative flex justify-end mt-4 mr-2.5 w-full">
            <button className="bg-gray-400/30 text-white border-none text-base font-bold rounded-lg py-1.5 px-2.5 cursor-pointer hover:bg-green-700" onClick={() => setCityOpen(!cityOpen)}>
              {selectedCity} ▼
            </button>
            {cityOpen && (
              <div className="absolute top-full right-0 bg-white border border-[#1A4718] rounded-lg min-w-[180px] shadow-lg p-2 z-10">
                <input
                  type="text"
                  className="w-full py-1.5 px-2.5 border-none border-b border-gray-300 text-sm outline-none"
                  placeholder="Search city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className="max-h-52 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent m-0 p-0">
                  {filteredCities.map((city) => (
                    <li
                      key={city}
                      className="text-[#1A4718] text-sm list-none py-2 px-3 cursor-pointer hover:bg-[#f0d003]"
                      onClick={() => {
                        setSelectedCity(city);
                        setCityOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <h3 className="text-[60px] font-extrabold text-white mb-0 ml-[50px] mt-3">{selectedScale === "Celsius" ? weather.tempC : weather.tempF}</h3>
          <p className="text-[12px] font-light text-white mt-0 mb-1 ml-[50px]">{weather.date}</p>
          <p className="inline-block bg-gray-400/30 text-[10px] font-bold text-white p-1 rounded-md mt-0 mb-0 ml-[50px]">Weather Forecast</p>
          <h4 className="text-[22px] font-bold text-white mt-0 ml-[50px]">{weather.condition}</h4>
        </div>

        {/* Hourly forecast section */}
        <div className="col-start-1 col-end-2 row-start-2 row-end-3 bg-white rounded-lg p-3.5">
          <h3 className="text-base text-[#1c2414] ml-[15px] mb-0.5">Hourly Forecast</h3>
          <p className="text-xs font-normal text-[#1A4718] ml-[15px] mb-2.5 mt-1.5">{weather.condition} conditions will continue for the rest of the day. Wind gusts are up to {weather.gusts}.</p>
          {/* Container for hourly weather updates */}
          <div className="flex flex-row items-center gap-2.5 ml-5">
            {weather.hourly.map((entry, index) => (
              <div key={index} className="flex flex-col gap-2.5 mr-4">
                <p className="text-base font-bold text-center mb-auto">{entry.hour}</p>
                <img src={entry.icon} alt="Weather Icon" className="w-[45px] h-auto mt-1.5 mb-0.5" />
                <p className="text-xs font-bold text-[#647a4c] mb-0.5">{entry.percent}</p>
                <p className="text-base font-bold mt-auto">{selectedScale === "Celsius" ? entry.tempC : entry.tempF}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weather map section */}
        <div className="col-start-1 col-end-2 row-start-3 row-end-5 rounded-lg">
          <img src={weatherMapImg} alt="Map" className="w-full h-full object-fill rounded-lg" />
        </div>

        {/* Other information section */}
        <div className="col-start-2 col-end-3 row-start-2 row-end-5 bg-white rounded-lg p-2.5 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent">
          {/* Container for individual weather info items */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Visibility</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.visibility}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Feels Like</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{selectedScale === "Celsius" ? weather.feelsLikeC : weather.feelsLikeF}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">UV</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.uv}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Pressure</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.pressure}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Rain Chance</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.rainChance}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Wind</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.wind}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Direction</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.direction}</h3>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3">
              <p className="text-sm font-normal text-black m-0">Gusts</p>
              <h3 className="text-lg font-bold text-[#1A4718] m-0">{weather.gusts}</h3>
            </div>
          </div>
        </div>

        {/* Sunrise and sunset information section */}
        <div className="col-start-3 col-end-4 row-start-4 row-end-5 bg-white rounded-lg p-1.5 flex flex-col gap-0">
          <div className="flex flex-row">
            <div className="flex flex-row justify-around items-center gap-2 mx-2.5 my-2.5">
            <img src={sunriseIconImg} alt="Sunrise Icon" className="w-[50px] h-auto" />
            <div className="flex flex-col mx-1.5">
              <p className="text-xl my-1.5 mx-3.5">Sunrise</p>
              <p className="text-[20px] font-bold m-0">6:05 AM</p>
            </div>
          </div>
          <div className="flex flex-row justify-around items-center gap-2.5 mx-2.5 my-2.5">
            <img src={sunsetIconImg} alt="Sunset Icon" className="w-[50px] h-auto" />
            <div className="flex flex-col mx-1.5">
              <p className="text-xl my-1.5 mx-3.5">Sunset</p>
              <p className="text-[20px] font-bold m-0">6:45 PM</p>
            </div>
          </div>
          
          </div>
        </div>

        {/* Main weather info and forecast display section */}
        <div className="col-start-3 col-end-4 row-start-1 row-end-4 bg-white rounded-lg overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent">
          {/* Header for weather forecast section */}
          <div className="flex flex-row justify-between items-center mt-2.5 mx-2.5 gap-1.5">
            <h3 className="text-sm text-[#1A4718] ml-[30px] mt-5 mb-0.5">Weather Forecast</h3>
            {/* Dropdown for selecting temperature scale */}
            <div className="relative ml-5">
              <button
                className="bg-[#1A4718] text-white border-none text-xs font-bold rounded-lg py-1.5 px-2.5 cursor-pointer hover:bg-green-700"
                onClick={() => setScalesOpen(!scalesOpen)}
              >
                {selectedScale}
              </button>
              {scalesOpen && (
                <ul className="absolute top-[30%] left-[0%] right-[60%] bg-white border border-gray-300 rounded-lg min-w-[120px] shadow-lg p-1 z-10">
                  <li className="text-xs list-none py-2 px-3 cursor-pointer hover:bg-[#f0d003]" onClick={() => { setSelectedScale("Celsius"); setScalesOpen(false); }}>
                    Celsius
                  </li>
                  <li className="text-xs list-none py-2 px-3 cursor-pointer hover:bg-[#f0d003]" onClick={() => { setSelectedScale("Fahrenheit"); setScalesOpen(false); }}>
                    Fahrenheit
                  </li>
                </ul>
              )}
            </div>
          </div>
          {/* Container for temperature scale-specific information */}
          <div className="mt-5">
            {selectedScale === "Celsius" && <CelsiusOption weather={weather} />}
            {selectedScale === "Fahrenheit" && <FahrenheihtOption weather={weather} />}
          </div>
          {/* Buttons for selecting forecast duration */}
          <div className="flex justify-center mt-2.5">
            <div className="inline-flex gap-2.5 bg-[#1a4718] border-none rounded-2xl p-1 px-3">
              {options.map((option) => (
                <button
                  key={option}
                  className={`border-none font-bold text-base cursor-pointer py-1.5 px-3 rounded-xl 
                    ${selected === option 
                      ? "bg-[#f0d003] text-[#1a4718]" 
                      : "bg-transparent text-white hover:bg-[#f0d003] hover:text-[#1a4718]"
                    }`}
                  onClick={() => setSelected(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {/* Forecast display section */}
          <div className="mt-5">
            {selected === "5 days" && <FiveDayForecast weather={weather} />}
            {selected === "15 days" && <FifteenDayForecast weather={weather} />}
            {selected === "30 days" && <ThirtyDayForecast weather={weather} />}
          </div>
        </div>

      </div>
    </div>
  );
}

// Component for displaying Celsius-specific weather information
function CelsiusOption({ weather }) {
  return (
    <div className="celsiusOption">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-[#1A4718] mb-2.5 mt-12.5">{weather.tempC}</h1>
        <h3 className="text-xl font-bold text-[#1A4718] mt-1.5 mb-4">{weather.condition}</h3>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">Wind | {weather.wind}</p>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">PoP | {weather.precipitation}</p>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">Hum | {weather.humidity}</p>
      </div>
    </div>
  );
}

// Component for displaying Fahrenheit-specific weather information
function FahrenheihtOption({ weather }) {
  return (
    <div className="fahrenheihtOption">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-[#1A4718] mb-2.5 mt-12.5">{weather.tempF}</h1>
        <h3 className="text-xl font-bold text-[#1A4718] mt-1.5 mb-4">{weather.condition}</h3>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">Wind | {weather.wind}</p>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">PoP | {weather.precipitation}</p>
        <p className="text-base font-light text-[#1A4718] mt-5 mb-0.5">Hum | {weather.humidity}</p>
      </div>
    </div>
  );
}

// Component for displaying the 5-day forecast
function FiveDayForecast({ weather }) {
  const days = weather.daily.slice(0, 5);
  return (
    <div className="p-2.5">
      <div className="flex flex-col">
        {days.map((entry, index) => (
          <div key={index} className="flex flex-row gap-[30px] mt-5">
            <img src={entry.icon} alt="Weather Icon" className="w-[50px] h-auto ml-[50px]" />
            <div className="flex flex-col">
              <p className="text-base mb-0.5">{entry.day}</p>
              <p className="text-xs font-light text-[#1A4718] mt-0.5">{entry.condition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for displaying the 15-day forecast
function FifteenDayForecast({ weather }) {
  const days = weather.daily.slice(0, 15);
  return (
    <div className="p-2.5">
      <div className="flex flex-col">
        {days.map((entry, index) => (
          <div key={index} className="flex flex-row gap-[30px] mt-5">
            <img src={entry.icon} alt="Weather Icon" className="w-[50px] h-auto ml-[50px]" />
            <div className="flex flex-col">
              <p className="text-base mb-0.5">{entry.day}</p>
              <p className="text-xs font-light text-[#1A4718] mt-0.5">{entry.condition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for displaying the 30-day forecast
function ThirtyDayForecast({ weather }) {
  const days = weather.daily.slice(0, 30);
  return (
    <div className="p-2.5">
      <div className="flex flex-col">
        {days.map((entry, index) => (
          <div key={index} className="flex flex-row gap-[30px] mt-5">
            <img src={entry.icon} alt="Weather Icon" className="w-[50px] h-auto ml-[50px]" />
            <div className="flex flex-col">
              <p className="text-base mb-0.5">{entry.day}</p>
              <p className="text-xs font-light text-[#1A4718] mt-0.5">{entry.condition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}