// src/pages/Dashboard.jsx
import React, { useState } from "react";
import Layout from "../layouts/Layout";
import DateRow from "../components/responder/DateRow";
import Cards from "../components/responder/Cards";
import Reports from "../components/responder/Reports";
import MapCard from "../components/responder/MapCard";
import ResourcesCard from "../components/responder/ResourcesCard";
import TriageCard from "../components/responder/TriageCard";
import Footer from "../components/responder/Footer";
import "../styles/personnel-style.css";

const Dashboard = () => {
  const [selectedCity, setSelectedCity] = useState("Metro Manila (All)");
  const [selectedHospital, setSelectedHospital] = useState("All DOH Hospitals");

  return (
    <Layout>
      <DateRow
        selectedCity={selectedCity}
        selectedHospital={selectedHospital}
        onCityChange={setSelectedCity}
        onHospitalChange={setSelectedHospital}
      />
      <Cards />

      {/* Reports + Map Grid */}
      <div className="cards-grid">
        <Reports />
        <MapCard />
      </div>

      {/* Triage Card */}
      <TriageCard />

      {/* Resources Card */}
      <ResourcesCard />

      {/* Footer */}
      <Footer />
    </Layout>
  );
};

export default Dashboard;
