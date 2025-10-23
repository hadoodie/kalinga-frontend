import React, { useState } from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import "../styles/personnel-style.css";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Feedback submitted!\nEmail: ${email}\nMessage: ${message}`);
    setEmail("");
    setMessage("");
  };

  return (
    <div className="footer-card">
      <footer className="footer">
        <div className="footer-top">
          {/* Feedback Form */}
          <div className="feedback">
            <h3 className="footer-title">We value your feedback!</h3>
            <p className="footer-subtitle">
              Let us know how we can improve our services.
            </p>
            <form onSubmit={handleSubmit} className="footer-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <textarea
                placeholder="Type your message here."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button type="submit">SEND</button>
            </form>
          </div>

          {/* Social Media */}
          <div className="social">
            <h3 className="footer-title">Follow KALINGA on Social Media</h3>
            <div className="social-icons">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="contact">
            <h3 className="footer-title">Contact Us</h3>
            <p>(+63) 919 601 3527 (8 to 3 PM)</p>
            <p>(+63) 968 357 0578 (3 to 10 PM)</p>
            <a href="mailto:contactus@kalinga.ph">contactus@kalinga.ph</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Kalinga. All rights reserved.</p>
          <div className="logo">KALINGA</div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
