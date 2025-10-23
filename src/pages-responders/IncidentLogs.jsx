import React from "react";
import Layout from "../layouts/Layout";
import "../styles/personnel-style.css";
import Footer from "../components/responder/Footer";

const IncidentLogs = () => {
  const incidents = [
    {
      id: "INC-20230923-001",
      name: "Juan Dela Cruz",
      role: "Reporter",
      type: "Fire Outbreak",
      location: "Zone 3, Brgy. Mabini",
      time: "2023-09-23 14:32",
      status: "Pending",
      response: "Unassigned",
    },
    {
      id: "INC-20230923-002",
      name: "Maria Santos",
      role: "Responder",
      type: "Medical Emergency",
      location: "Zone 5, Brgy. Mabini",
      time: "2023-09-23 15:00",
      status: "Resolved",
      response: "Assigned",
    },
    {
      id: "INC-20230923-003",
      name: "Pedro Ramos",
      role: "Reporter",
      type: "Flooding",
      location: "Zone 2, Brgy. Mabini",
      time: "2023-09-23 16:15",
      status: "Ongoing",
      response: "Assigned",
    },
    {
      id: "INC-20230923-004",
      name: "Ana Dizon",
      role: "Reporter",
      type: "Missing Person",
      location: "Zone 4, Brgy. Mabini",
      time: "2023-09-23 17:45",
      status: "Critical",
      response: "Unassigned",
    },
    {
      id: "INC-20230923-005",
      name: "Mark Lopez",
      role: "Responder",
      type: "Collapsed Structure",
      location: "Zone 1, Brgy. Mabini",
      time: "2023-09-23 18:20",
      status: "Ongoing",
      response: "Assigned",
    },
    {
      id: "INC-20230923-006",
      name: "Carla Reyes",
      role: "Reporter",
      type: "Road Accident",
      location: "Zone 6, Brgy. Mabini",
      time: "2023-09-23 19:10",
      status: "Resolved",
      response: "Assigned",
    },
    {
      id: "INC-20230923-007",
      name: "James Cruz",
      role: "Reporter",
      type: "Fire Outbreak",
      location: "Zone 7, Brgy. Mabini",
      time: "2023-09-23 20:30",
      status: "Pending",
      response: "Unassigned",
    },
  ];

  // Status/type based row colors
  const getRowClass = (log) => {
    if (log.status === "Resolved") return "status-resolved"; // green
    if (log.status === "Pending" || log.status === "Ongoing") return "status-ongoing"; // yellow
    if (log.status === "Critical" || log.type === "Missing Person") return "status-critical"; // red
    return "";
  };

  return (
    <Layout>
      <div className="incident-logs">
        <h2>Incident Logs</h2>
        <table className="incident-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Incident Type</th>
              <th>Location</th>
              <th>Time Logged</th>
              <th>Status</th>
              <th>Response Assigned</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((log, index) => (
              <tr key={index} className={getRowClass(log)}>
                <td>{log.id}</td>
                <td>{log.name}</td>
                <td>{log.role}</td>
                <td>{log.type}</td>
                <td>{log.location}</td>
                <td>{log.time}</td>
                <td>{log.status}</td>
                <td>{log.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <Footer />
    </Layout>
  );
};

export default IncidentLogs;
