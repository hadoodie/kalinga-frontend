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
  { name: "Mission", href: "#mission" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed w-full z-40 transition-all duration-300 border-b border-gray-200",
        isScrolled ? "py-3 bg-background backdrop-blur-md shadow-xs" : "py-5 bg-background"
      )}
    >
      <div className="container flex items-center justify-between">
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

        {/* desktop nav */}
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

        {/* mobile nav */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden p-2 text-foreground z-50"
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={cn(
            "fixed inset-0 bg-background/95 backdrop-blur-md z-40 flex flex-col items-center justify-center", // ✅ fixed typo
            "transition-all duration-300 md:hidden",
            isMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <div className="flex flex-col space-y-8 text-xl">
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

            {/* Sign In Button for mobile */}
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
