// src/pages/Dashboard.jsx
import React, { useState } from "react";
import Layout from "../layouts/Layout";
import DateRow from "../components/DateRow";
import Cards from "../components/Cards";
import Reports from "../components/Reports";
import MapCard from "../components/MapCard";
import ResourcesCard from "../components/ResourcesCard";
import TriageCard from "../components/TriageCard";
import Footer from "../components/Footer";

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
