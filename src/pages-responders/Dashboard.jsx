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
import EmergencyNotifications from "../components/responder/EmergencyNotifications";

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

      <div className="mt-6">
        <EmergencyNotifications />
      </div>

      <div className="cards-grid mt-4">
        <Reports selectedHospital={selectedHospital} />
        <MapCard
          selectedCity={selectedCity}
          selectedHospital={selectedHospital}
        />
      </div>

      <div className="mt-4">
        <TriageCard selectedHospital={selectedHospital} />
      </div>

      <div className="mt-4">
        <ResourcesCard />
      </div>

      <Footer />
    </Layout>
  );
};

export default Dashboard;
