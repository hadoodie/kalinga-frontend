// Responder Messages Component - Simplified wrapper that hides patient-specific features
import { useState, useEffect } from "react";
import PatientMessages from "../patients/Messages";

/**
 * ResponderMessages - A wrapper component that provides responder-specific styling
 * This hides the "New Message", "Contact Directory", and "Support & FAQ" buttons
 * while keeping all the core messaging functionality
 */
const ResponderMessages = () => {
  return (
    <div className="responder-messages-wrapper h-full">
      <style>
        {`
          /* Hide New Message button (has Plus icon) */
          .responder-messages-wrapper button:has(> svg.lucide-plus) {
            display: none !important;
          }
          
          /* Hide Contact Directory button (has Phone icon) */
          .responder-messages-wrapper button:has(> svg.lucide-phone):not(:has(> span)) {
            display: none !important;
          }
          
          /* Hide Support & FAQ button (has HelpCircle icon) */
          .responder-messages-wrapper button:has(> svg.lucide-help-circle) {
            display: none !important;
          }
        `}
      </style>
      <PatientMessages />
    </div>
  );
};

export default ResponderMessages;
