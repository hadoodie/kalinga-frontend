import {
  Mail,
  Smartphone,
  Phone,
  Send,
  Twitter,
  ArrowUp,
  Facebook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const Footer = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <footer className="py-16 px-6 bg-background border-t border-border mt-12">
      <div className="container mx-auto max-w-6xl">
        {/* Grid: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 1st Column: Feedback Form */}
          <div
            className="bg-background p-8 rounded-lg shadow"
            onSubmit={handleSubmit}
          >
            <h3 className="text-2xl font-semibold mb-3">We Value Your Feedback</h3>
            <p className="mb-6">Let us know how we can improve our services.</p>
            <form className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary"
                  placeholder="juan.delacruz@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Your Message
                </label>
                <textarea
                  id="message"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Hello, I'd like to share my feedback..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn("button w-full flex items-center justify-center gap-2")}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* 2nd Column: Social + Contact */}
          <div className="flex flex-col items-center justify-center space-y-12 text-center">
            {/* Social Media */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-6">Connect With Us</h3>
              <div className="flex flex-col items-center space-y-4">
                <a
                  href="#"
                  target="_blank"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter /> Twitter
                </a>
                <a
                  href="#"
                  target="_blank"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook /> Facebook
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <a
                    href="tel:+639196013527"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (+63) 919 601 3527
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <a
                    href="tel:+829876543"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (82) 876-543
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a
                    href="mailto:hihello@gmail.com"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    hihello@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-16 flex flex-wrap justify-between items-center border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kalinga. All rights reserved.
          </p>
          <a
            href="#hero"
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <ArrowUp size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};
