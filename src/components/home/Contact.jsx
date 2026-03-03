import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/kalinga-logo.png";

export const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Run only once
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "✅ Message Sent!",
        description:
          "We’ve received your message. Check your email for confirmation.",
      });
    }, 1500);
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className={cn(
        "py-20 px-6 md:py-28 md:px-8 relative bg-green-950 text-gray-200 transition-opacity duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* LEFT COLUMN */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img src={logo} alt="Logo" className="w-60 mb-4" />
          <h3 className="text-2xl font-extrabold">We Value Your Feedback!</h3>
          <h4 className="text-lg font-semibold mb-2">
            Let us know how we can improve our services
          </h4>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            You'll receive an email confirming your submission after sending
            your form. Our representative will contact you within{" "}
            <span className="font-bold">24–72 hours</span>.
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full max-w-lg flex flex-col justify-center">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 text-left"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 rounded-md border border-input focus:ring-2 focus:ring-primary text-sm placeholder-gray-400"
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-left"
              >
                Your Email
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-3 rounded-md border border-input focus:ring-2 focus:ring-primary text-sm placeholder-gray-400"
                placeholder="juan.delacruz@gmail.com"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2 text-left"
              >
                Your Message
              </label>
              <textarea
                id="message"
                required
                rows="5"
                className="w-full px-4 py-3 rounded-md border border-input focus:ring-2 focus:ring-primary text-sm placeholder-gray-400"
                placeholder="Hello, I'd like to share my feedback..."
              />
            </div>

            <div className="flex justify-center md:justify-start">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "button bg-background text-green-950 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium"
                )}
              >
                {isSubmitting ? "Sending..." : "Send"}
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
