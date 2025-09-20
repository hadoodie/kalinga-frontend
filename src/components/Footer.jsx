import {
  Mail,
  Smartphone,
  Phone,
  Facebook,
  Linkedin,
  Twitter,
} from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-10 px-6 bg-[#f5fbf7]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          {/* Columns 1 & 2 Wrapper */}
          <div className="flex flex-row gap-10 justify-center text-center md:justify-start md:text-left w-full md:w-auto">
            {/* Column 1: Contact Us */}
            <div>
              <h3 className="text-xl font-extrabold mb-3">Contact Us</h3>
              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <a
                    href="tel:+639196013527"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (+63) 919 601 3527
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs">
                  <Phone className="h-4 w-4 text-primary" />
                  <a
                    href="tel:+829876543"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    (82) 876-543
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs">
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

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-xl font-extrabold mb-3">Quick Links</h3>
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

          {/* Column 3: Name + Socials */}
          <div className="flex flex-col items-center md:items-end space-y-3">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-300 to-green-700 bg-clip-text text-transparent">
              KALINGA
            </h1>
            <div className="flex flex-row gap-4">
              <a
                href="#"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook size={28} />
              </a>
              <a
                href="#"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin size={28} />
              </a>
              <a
                href="#"
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter size={28} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 flex flex-wrap justify-center md:justify-between items-center border-t border-border pt-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Kalinga. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
