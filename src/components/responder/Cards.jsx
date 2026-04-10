import React from "react";
import HealthRespondersCard from "./HealthRespondersCard";
import PeopleShelteredCard from "./HospitalPatientChart";
import "../../styles/personnel-style.css"; // reuse same css file

const Cards = () => {
  return (
    <div className="cards-row">
      <HealthRespondersCard />
      <PeopleShelteredCard />
    </div>
  );
};

export default Cards;
