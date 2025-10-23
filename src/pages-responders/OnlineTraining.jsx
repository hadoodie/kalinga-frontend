import React from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/personnel-style.css";
import Courses from "../components/responder/Courses";

// ✅ Import icons from react-icons
import { FaUniversity, FaLaptopCode, FaChalkboardTeacher, FaChartLine } from "react-icons/fa";

const OnlineTraining = () => {
  return (
    <Layout>
      <div className="online-training">
        
        {/* Section 1: Welcome Banner */}
        <section className="welcome-section">
          <div className="welcome-text">
            <h3>Equip citizens and government employees with in-demand skills</h3>
            <p>
              Drive sustainable economic growth and build a competitive workforce with 
              online learning from leading universities and companies.
            </p>
            <a href="#">Train your personnel workforce →</a>
            <br />
            <a href="#">Upskill your medical portfolio →</a>
          </div>
          <div className="welcome-img">
            <img src="/equipcitizens.jpg" alt="Equip Citizens" />
          </div>
        </section>

        {/* Section 2: Career Solutions */}
        <section className="career-section">
          <h3>Choose the right career solutions for your citizens and employees</h3>
          <div className="career-cards">
            {/* Government Employee Upskilling */}
            <div className="career-card">
              <img 
                src="/trainyourgovt.jpg" 
                alt="Government Employee Upskilling" 
                className="career-img" 
              />
              <div className="career-text">
                <h4>GOVERNMENT EMPLOYEE UPSKILLING</h4>
                <p><strong>Train your government employees</strong></p>
                <p>
                  Build the skilled workforce needed to improve service efficiency and 
                  drive performance results.
                </p>
                <a href="#">Learn More →</a>
              </div>
            </div>

            {/* Citizen Workforce Development */}
            <div className="career-card">
              <img 
                src="/trainyourcitz.jpg" 
                alt="Citizen Workforce Development" 
                className="career-img" 
              />
              <div className="career-text">
                <h4>CITIZEN WORKFORCE DEVELOPMENT</h4>
                <p><strong>Train your citizens</strong></p>
                <p>
                  Enable your workforce to develop job-relevant skills to help reduce 
                  unemployment and increase economic competitiveness.
                </p>
                <a href="#">Learn More →</a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Grow Talent */}
        <section className="talent-section">
          <div className="talent-left">
            <h3>
              Grow your talent and economy with the world’s leading skills platform
            </h3>
            <p>
              Drive sustainable economic growth and build a competitive workforce with 
              online learning from leading universities and companies.
            </p>
          </div>

          <div className="talent-right">
            <div className="talent-item">
              <span className="emoji"><FaUniversity size={28} color="#1E2A78" /></span>
              <div>
                <h4>World-Class Training</h4>
                <p>
                  Empower your learners with world-class training and credentials from 
                  350+ leading universities and companies.
                </p>
              </div>
            </div>

            <div className="talent-item">
              <span className="emoji"><FaLaptopCode size={28} color="#27ae60" /></span>
              <div>
                <h4>In-Demand Skills</h4>
                <p>
                  Offer training in data, technology, and leadership skills.
                </p>
              </div>
            </div>

            <div className="talent-item">
              <span className="emoji"><FaChalkboardTeacher size={28} color="#2980b9" /></span>
              <div>
                <h4>Hands-on Learning</h4>
                <p>
                  Enable applied learning through assessments and projects.
                </p>
              </div>
            </div>

            <div className="talent-item">
              <span className="emoji"><FaChartLine size={28} color="#e67e22" /></span>
              <div>
                <h4>Actionable Insights</h4>
                <p>
                  Track training, measure progress to guide strategic decisions.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Section 5: Footer */}
        <Footer />
      </div>
    </Layout>
  );
};

export default OnlineTraining;
