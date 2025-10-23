import React from "react";
import WeatherCard from "./WeatherCard";
import HealthRespondersCard from "./HealthRespondersCard";
import PeopleShelteredCard from "./HospitalPatientChart";
import "../../styles/personnel-style.css"; // reuse same css file

const Cards = () => {
  return (
    <div className="cards-row">
      <WeatherCard />
      <HealthRespondersCard />
      <PeopleShelteredCard />
    </div>
  );
};

export default Cards;
