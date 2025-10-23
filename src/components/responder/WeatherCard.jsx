import React, { useEffect, useState } from "react";
import "../../styles/weather-card.css";

const API_KEY = "b92dd4a2d36476f40d39c0b8e8114a62";

const WeatherCard = ({ city }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        if (response.ok) {
          setWeather(data);
        } else {
          console.error("API error:", data);
          setWeather(null);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
        setWeather(null);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, [city]);

  if (!weather) {
    return (
      <div className="card weather">
        <h3>Weather</h3>
        <p>⚠️ Unable to load weather data.</p>
      </div>
    );
  }

  const localTime = new Date(weather.dt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card weather">
      <div className="weather-top">
        {/* LEFT SIDE */}
        <div className="left">
          <h2>{weather.name}</h2>
          <p>{localTime}</p>
          <p className="condition">{weather.weather[0].description}</p>
        </div>

        {/* RIGHT SIDE (icon + temp + details stacked) */}
        <div className="right">
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt="weather icon"
          />
          <h1>{Math.round(weather.main.temp)}°C</h1>

          <div className="details">
            <p>Precipitation: {weather.clouds.all}%</p>
            <p>Humidity: {weather.main.humidity}%</p>
            <p>Wind: {Math.round(weather.wind.speed * 3.6)} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
