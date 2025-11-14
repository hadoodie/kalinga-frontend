import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FaqItem = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 text-left"
      >
        <span className="text-lg font-semibold text-primary">{question}</span>
        <ChevronDown
          className={`w-6 h-6 text-primary shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 pr-10 text-gray-700 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default function Faqs() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 p-6 bg-white rounded-xl shadow-lg flex items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
              Frequently Asked Questions
            </h1>
            <p className="text-left text-primary mt-1">
              Find answers to common questions about your Kalinga account.
            </p>
          </div>
        </header>

        {/* FAQ List Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 text-left">
          
          {/* Patient FAQs */}
          <h2 className="text-2xl font-bold text-primary mb-4">Patient Questions</h2>
          <FaqItem question="Is my health data secure?">
            <p>
              Yes. We take your privacy extremely seriously. All your personal and health information (PHI) is
              encrypted during transit and at rest on our secure servers. Access is restricted strictly
              based on user roles, meaning only you and authorized medical personnel can view your sensitive data.
            </p>
          </FaqItem>
          <FaqItem question="How do I see my lab results?">
            <p>
              Once you are logged in as a verified patient, navigate to the "Dashboard" page. Your most recent
              lab results will be displayed in a table. You can also go to the "My Health Records" page,
              click the "Test Results" tab, and click on any result to see its full details.
            </p>
          </FaqItem>

          <FaqItem question="Is Kalinga a replacement for 911?">
            <p className="font-bold text-red-600">
              No. Kalinga is a tool that works *in coordination with* 911, but it does not
              replace it.
            </p>
            <p>
              In any life-threatening emergency, you must always <strong>call 911 directly</strong> first. The Kalinga
              app's emergency features are designed to supplement this by providing critical data to
              responders <strong>after</strong> 911 has been alerted.
            </p>
          </FaqItem>

          {/* Logistics FAQs */}
          <h2 className="text-2xl font-bold text-primary mt-12 mb-4">Logistics Questions</h2>
          <FaqItem question="What is the difference between 'Incoming Requests' and 'Track My Requests'?">
            <p>
              <strong>Incoming Requests:</strong> These are requests made <strong>by other hospitals or field units</strong>
              that <strong>you</strong> need to review, approve, and fulfill. Your job is to manage this queue.
            </p>
            <p>
              <strong>Track My Requests:</strong> This is a list of requests <strong>you have created</strong> and sent to
              other hospitals or locations. This tab allows you to track the status of your own outgoing requests.
            </p>
          </FaqItem>
          <FaqItem question="How do I update the status of a delivery?">
            <p>
              On the "Incoming Requests" tab, click on an approved request. At the bottom of the details panel,
              you will see a dropdown labeled "Update Progress." You can select the new status (e.g., "Packed",
              "Shipped", "Delivered") and click "Update Status."
            </p>
          </FaqItem>
          <FaqItem question="What happens when I reject a request?">
            <p>
              When you click the "Reject" button, a modal will appear asking you to provide a reason. This
              reason is logged and will be visible to the original requester in their "Allocation History"
              so they understand why the request could not be fulfilled.
            </p>
          </FaqItem>
        </div>
      </div>
    </div>
  );
}