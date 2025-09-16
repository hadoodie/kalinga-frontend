import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HashLink } from "react-router-hash-link";
import { Link } from "react-router-dom"; 
import logo from "../assets/kalinga-logo.png";

const navItems = [
  { name: "Home", href: "#hero" },
  { name: "About", href: "#about" },
  { name: "Our Doctors", href: "#doctors" },
  { name: "Contact Us", href: "#contact" },
];

export const NavbarA = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed w-full z-50 transition-all duration-300 border-b border-gray-200",
          isScrolled ? "py-3 bg-background backdrop-blur-md shadow-xs" : "py-5 bg-background"
        )}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <HashLink
            smooth
            to="/#hero"
            className="flex items-center space-x-2 text-xl font-bold text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            <img src={logo} alt="Kalinga Logo" className="h-10 w-auto" />
            <span className="relative z-10">
              <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-950 bg-clip-text text-transparent">
                KALINGA
              </span>
            </span>
          </HashLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, key) => (
              <HashLink
                key={key}
                smooth
                to={`/${item.href}`}
                className="text-foreground/80 hover:text-primary transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </HashLink>
            ))}

            {/* Sign In Button */}
            <Link
              to="/login"
              className="ml-4 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-foreground z-50 relative"
            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center space-y-8">
          {/* Close Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-5 right-5 text-foreground"
            aria-label="Close Menu"
          >
            <X size={32} />
          </button>

          {/* Menu Items */}
          {navItems.map((item, key) => (
            <HashLink
              key={key}
              smooth
              to={`/${item.href}`}
              className="text-2xl font-medium text-foreground hover:text-primary transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </HashLink>
          ))}

          {/* Sign In Button */}
          <Link
            to="/login"
            className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300 text-lg"
            onClick={() => setIsMenuOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </>
  );
};
