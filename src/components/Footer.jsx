import {
  Mail,
  Smartphone,
  Phone,
  Send,
  Twitter,
  ArrowUp,
  Facebook,
  Linkedin,
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
    <footer className="py-8 px-6 bg-background border-t border-border mt-8">
      <div className="container mx-auto max-w-6xl">
        {/* Grid: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* 1st Column: Feedback Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <h3 className="text-xl font-extrabold mb-1 text-left">
                We value your feedback!
              </h3>
              <p className="mb-3 text-xs text-muted-foreground text-left">
                Let us know how we can improve our services.
              </p>
              <form className="space-y-2" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium mb-1 text-left"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary text-xs"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium mb-1 text-left"
                  >
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary text-xs"
                    placeholder="juan.delacruz@gmail.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-medium mb-1 text-left"
                  >
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows="3"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary resize-none text-xs"
                    placeholder="Hello, I'd like to share my feedback..."
                  />
                </div>
                <div className="flex justify-left">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "button flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs"
                    )}
                  >
                    {isSubmitting ? "Sending..." : "Send"}
                    <Send size={12} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 2nd Column: Social + Contact + Quick Links */}
          <div className="flex flex-col space-y-6 text-left">
            {/* Social Media */}
            <div>
              <h3 className="text-xl font-extrabold mb-2">Connect With Us</h3>
              <div className="flex flex-row gap-4">
                <a
                  href="#"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin size={30} />
                </a>
                <a
                  href="#"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter size={30} />
                </a>
                <a
                  href="#"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook size={30} />
                </a>
              </div>
            </div>

            <div className="flex flex-row gap-12">
              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-extrabold mb-2">Contact Us</h3>
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-xs">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <a
                      href="tel:+639196013527"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      (+63) 919 601 3527
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-4 w-4 text-primary" />
                    <a
                      href="tel:+829876543"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      (82) 876-543
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-4 w-4 text-primary" />
                    <a
                      href="mailto:hihello@gmail.com"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      hihello@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-xl font-extrabold mb-2">Quick Links</h3>
                <div className="flex flex-col space-y-2 text-sm">
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms and Conditions
                  </a>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    FAQs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-6 flex flex-wrap justify-between items-center border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Kalinga. All rights reserved.
          </p>
          <a
            href="#hero"
            className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
};
