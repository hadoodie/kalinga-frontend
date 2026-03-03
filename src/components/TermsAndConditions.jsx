import { FileText } from 'lucide-react';

const TermsSection = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-primary mb-3">{title}</h2>
    <div className="text-gray-700 text-left space-y-4">{children}</div>
  </section>
);

export default function TermsAndConds() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 p-6 bg-white rounded-xl shadow-lg flex items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
              Terms & Conditions
            </h1>
            <p className="text-left text-primary mt-1">Last Updated: November 14, 2025</p>
          </div>
        </header>

        {/* Terms Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 text-left">
          <TermsSection title="1. Acceptance of Terms">
            <p>
              By creating an account and using the Kalinga web application ("Service"), you agree to be bound by
              these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </TermsSection>

          <TermsSection title="2. Description of Service">
            <p>
              Kalinga is a platform designed to connect Patients, Healthcare Providers, Logistics Personnel, and
              Responders. Its functions include, but are not limited to, managing personal health records,
              scheduling appointments, facilitating resource allocation, and tracking supplies.
            </p>
          </TermsSection>

          <TermsSection title="3. Emergency Services Disclaimer">
            <p className="font-bold text-red-600">
              IMPORTANT: While Kalinga is designed to coordinate with 911 and local emergency services, it is NOT
              a replacement for directly contacting them. In a life-threatening emergency, you must
              call your local emergency hotline immediately.
            </p>
            <p>
              The Service is an informational and logistical tool. It is NOT intended to provide medical advice.
              Always seek the advice of your doctor or other qualified health provider with any questions you may
              have regarding a medical condition.
            </p>
          </TermsSection>

          <TermsSection title="4. User Accounts and Verification">
            <p>
              You must provide accurate and complete information to register for an account. To access certain
              features (e.g., Patient health records, Logistics actions), you must complete our identity
              verification process. You are responsible for maintaining the confidentiality of your account and
              password.
            </p>
          </TermsSection>

          <TermsSection title="5. User Conduct">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit false, misleading, or inaccurate information.</li>
              <li>Misuse any emergency reporting features.</li>
              <li>Access data you are not authorized to access (e.g., another patient's health records).</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            </ul>
          </TermsSection>

          <TermsSection title="6. Resource & Supply Allocation">
            <p>
              For Logistics and Hospital users, the Service facilitates the request and allocation of resources.
              Kalinga does not guarantee the availability of any resource. All allocations are subject to approval
              by the handling personnel. We are not responsible for the quality, condition, or delivery of
              allocated resources.
            </p>
          </TermsSection>

          <TermsSection title="7. Limitation of Liability">
            <p>
              The Service is provided "as is." We make no warranties regarding the reliability, availability, or
              accuracy of the Service, including any weather data, notification alerts, or supply tracking ETAs.
              To the fullest extent permitted by law, Kalinga shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising out of or related to your use of the Service.
            </p>
          </TermsSection>

          <TermsSection title="8. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of the
              Philippines, without regard to its conflict of law provisions.
            </p>
          </TermsSection>
        </div>
      </div>
    </div>
  );
}