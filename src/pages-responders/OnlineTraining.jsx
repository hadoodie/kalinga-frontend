import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/online-training.css";
import Courses from "../components/responder/Courses";

// Import icons from react-icons
import {
  FaUniversity,
  FaLaptopCode,
  FaChalkboardTeacher,
  FaChartLine,
  FaPlay,
  FaArrowRight,
  FaCertificate,
  FaUsers,
  FaGraduationCap,
  FaBookOpen,
  FaMedkit,
  FaShieldAlt,
  FaHeartbeat,
  FaBrain,
  FaStethoscope,
  FaAmbulance,
} from "react-icons/fa";

const OnlineTraining = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  // Training categories
  const categories = [
    { id: "all", name: "All Courses", icon: FaBookOpen },
    { id: "medical", name: "Medical Training", icon: FaMedkit },
    { id: "emergency", name: "Emergency Response", icon: FaAmbulance },
    { id: "professional", name: "Professional Dev", icon: FaGraduationCap },
    { id: "mental", name: "Mental Health", icon: FaBrain },
  ];

  // Featured courses data
  const featuredCourses = [
    {
      id: 1,
      title: "Emergency Medical Responder (EMR)",
      category: "medical",
      duration: "24 hours",
      enrolled: 1234,
      rating: 4.8,
      image: "/course-emr.jpg",
      progress: 65,
    },
    {
      id: 2,
      title: "Psychological First Aid",
      category: "mental",
      duration: "16 hours",
      enrolled: 856,
      rating: 4.9,
      image: "/course-pfa.jpg",
      progress: 0,
    },
    {
      id: 3,
      title: "Disaster Risk Management",
      category: "emergency",
      duration: "32 hours",
      enrolled: 2341,
      rating: 4.7,
      image: "/course-drm.jpg",
      progress: 100,
    },
  ];

  // Stats data
  const stats = [
    { label: "Active Learners", value: "12,500+", icon: FaUsers },
    { label: "Courses Available", value: "50+", icon: FaBookOpen },
    { label: "Certificates Issued", value: "8,750+", icon: FaCertificate },
    { label: "Expert Instructors", value: "120+", icon: FaChalkboardTeacher },
  ];

  return (
    <Layout>
      <div className="online-training">
        {/* Hero Section */}
        <motion.section 
          className="hero-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-content">
            <motion.div 
              className="hero-text"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="hero-badge">
                <FaGraduationCap /> Kalinga Training Portal
              </span>
              <h1>Equip Citizens & Government Employees with In-Demand Skills</h1>
              <p>
                Drive sustainable economic growth and build a competitive
                workforce with online learning from leading universities and
                healthcare institutions.
              </p>
              <div className="hero-actions">
                <button className="btn-primary">
                  <FaPlay /> Start Learning
                </button>
                <button className="btn-outline">
                  Browse Courses <FaArrowRight />
                </button>
              </div>
            </motion.div>
            <motion.div 
              className="hero-visual"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="hero-card-stack">
                <div className="hero-card card-1">
                  <FaMedkit />
                  <span>Medical Training</span>
                </div>
                <div className="hero-card card-2">
                  <FaShieldAlt />
                  <span>Emergency Response</span>
                </div>
                <div className="hero-card card-3">
                  <FaHeartbeat />
                  <span>First Aid & CPR</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section 
          className="stats-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <stat.icon className="stat-icon" />
                <div className="stat-info">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Career Solutions Section */}
        <section className="career-section">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Choose the Right Career Solutions</h2>
            <p>Tailored training programs for citizens and government employees</p>
          </motion.div>
          
          <div className="career-cards">
            <motion.div 
              className="career-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <div className="career-icon">
                <FaUsers />
              </div>
              <div className="career-content">
                <span className="career-label">GOVERNMENT EMPLOYEE UPSKILLING</span>
                <h3>Train Your Government Workforce</h3>
                <p>
                  Build the skilled workforce needed to improve service
                  efficiency and drive performance results in public health
                  and emergency response.
                </p>
                <ul className="career-features">
                  <li><FaChalkboardTeacher /> Expert-led workshops</li>
                  <li><FaCertificate /> Accredited certifications</li>
                  <li><FaChartLine /> Progress tracking</li>
                </ul>
                <a href="#" className="career-link">
                  Learn More <FaArrowRight />
                </a>
              </div>
            </motion.div>

            <motion.div 
              className="career-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <div className="career-icon citizen">
                <FaGraduationCap />
              </div>
              <div className="career-content">
                <span className="career-label">CITIZEN WORKFORCE DEVELOPMENT</span>
                <h3>Empower Your Community</h3>
                <p>
                  Enable your workforce to develop job-relevant skills to help
                  reduce unemployment and increase community health awareness.
                </p>
                <ul className="career-features">
                  <li><FaBookOpen /> Self-paced learning</li>
                  <li><FaStethoscope /> Medical skills training</li>
                  <li><FaAmbulance /> Emergency preparedness</li>
                </ul>
                <a href="#" className="career-link">
                  Learn More <FaArrowRight />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Talent Section */}
        <section className="talent-section">
          <div className="talent-container">
            <motion.div 
              className="talent-left"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2>Grow Your Talent with World-Class Skills Platform</h2>
              <p>
                Access comprehensive training from leading healthcare
                institutions, universities, and emergency response experts.
              </p>
              <div className="talent-stats">
                <div className="talent-stat">
                  <span className="stat-number">350+</span>
                  <span className="stat-label">Partner Institutions</span>
                </div>
                <div className="talent-stat">
                  <span className="stat-number">98%</span>
                  <span className="stat-label">Completion Rate</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="talent-right"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="talent-item">
                <span className="talent-icon">
                  <FaUniversity />
                </span>
                <div>
                  <h4>World-Class Training</h4>
                  <p>
                    Empower learners with credentials from 350+ leading
                    universities and healthcare institutions.
                  </p>
                </div>
              </div>

              <div className="talent-item">
                <span className="talent-icon green">
                  <FaLaptopCode />
                </span>
                <div>
                  <h4>In-Demand Skills</h4>
                  <p>
                    Training in medical technology, emergency response,
                    and healthcare leadership.
                  </p>
                </div>
              </div>

              <div className="talent-item">
                <span className="talent-icon blue">
                  <FaChalkboardTeacher />
                </span>
                <div>
                  <h4>Hands-on Learning</h4>
                  <p>
                    Practical assessments, simulations, and real-world
                    project experience.
                  </p>
                </div>
              </div>

              <div className="talent-item">
                <span className="talent-icon orange">
                  <FaChartLine />
                </span>
                <div>
                  <h4>Actionable Insights</h4>
                  <p>
                    Track progress, measure outcomes, and guide strategic
                    workforce decisions.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Courses Component */}
        <section className="courses-section">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Explore Our Training Programs</h2>
            <p>Comprehensive courses designed for healthcare and emergency response professionals</p>
          </motion.div>
          <Courses />
        </section>

        {/* CTA Section */}
        <motion.section 
          className="cta-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="cta-content">
            <h2>Ready to Start Your Learning Journey?</h2>
            <p>
              Join thousands of healthcare professionals and responders
              who have enhanced their skills through Kalinga.
            </p>
            <div className="cta-actions">
              <button className="btn-primary large">
                Get Started Today <FaArrowRight />
              </button>
              <button className="btn-outline large">
                View All Courses
              </button>
            </div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </Layout>
  );
};

export default OnlineTraining;
