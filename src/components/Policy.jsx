const PolicySection = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-primary mb-3">{title}</h2>
    <div className="text-gray-700 text-left space-y-4">{children}</div>
  </section>
);

export default function PrivacyPolicies() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 p-6 bg-white rounded-xl shadow-lg flex items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
              Privacy Policy
            </h1>
            <p className="text-left text-primary mt-1">Last Updated: November 14, 2025</p>
          </div>
        </header>

        {/* Policy Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 text-left">
          <PolicySection title="1. Introduction">
            <p>
              Welcome to Kalinga. We are committed to protecting your privacy and handling your personal and health
              information with care and respect. This Privacy Policy outlines how we collect, use, disclose, and
              safeguard your information when you use our web application.
            </p>
            <p>
              By using our service, you agree to the collection and use of information in accordance with this policy.
              This policy applies to all users, including Patients, Logistics Personnel, Responders, and Administrators.
            </p>
          </PolicySection>

          <PolicySection title="2. Information We Collect">
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Personal Identification Information (PII):</strong> Name, email address, phone number,
                date of birth, address, and images of your government-issued ID for verification.
              </li>
              <li>
                <strong>Protected Health Information (PHI):</strong> Information you provide or that is generated
                through your use of our service, such as lab results, allergies, diagnoses, medications, and
                appointment history.
              </li>
              <li>
                <strong>Logistics & Operations Data:</strong> For Logistics and Responder users, we collect data on
                resource requests, inventory, shipment locations, and allocation history.
              </li>
              <li>
                <strong>Usage Data:</strong> We may collect information on how you access and use the Service,
                including your IP address, browser type, and pages visited.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="3. How We Use Your Information">
            <p>We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our service.</li>
              <li>To manage your account, including verification and authentication.</li>
              <li>
                To facilitate resource allocation and supply tracking between hospitals and logistics teams.
              </li>
              <li>To manage and schedule patient appointments.</li>
              <li>
                To send you notifications and alerts related to your health, appointments, or resource requests.
              </li>
              <li>To respond to emergencies (for Responder and Patient roles).</li>
              <li>To improve the reliability and features of our Service.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. How We Share Your Information">
            <p>
              Your privacy is paramount. We do not sell your personal information. We may share your information
              only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>With Healthcare Providers:</strong> Your PHI may be accessible to authorized healthcare
                providers (doctors, hospitals) within the Kalinga network for the purpose of providing you care.
              </li>
              <li>
                <strong>With Logistics & Responders:</strong> In an emergency or during an allocation request,
                necessary information (e.g., location, required items) is shared with authorized logistics and
                responder personnel to fulfill the request.
              </li>
              <li>
                <strong>For Legal Requirements:</strong> We may disclose your information if required to do so by
                law or in response to valid requests by public authorities (e.g., a court or government agency).
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Data Security">
            <p>
              We use robust security measures to protect your information. Your data is stored on secure,
              encrypted servers and transmitted using industry-standard SSL encryption.
              Access to PHI is strictly role-based and audited.
            </p>
          </PolicySection>

          <PolicySection title="6. Your Rights">
            <p>
              You have the right to access, update, or correct your personal information at any time through your
              Profile and Settings pages. You may also have the right to request the deletion of your account.
            </p>
          </PolicySection>

          <PolicySection title="7. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="font-semibold">
              Kalinga Support Team <br />
              Email: privacy@kalinga.app
            </p>
          </PolicySection>
        </div>
      </div>
    </div>
  );
}