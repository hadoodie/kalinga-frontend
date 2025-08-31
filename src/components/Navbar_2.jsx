import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { HashLink } from "react-router-hash-link";
import logo from "../assets/kalinga-logo.png";

export const NavbarB = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
        >
          <img src={logo} alt="Kalinga Logo" className="h-10 w-auto" />
          <span className="relative z-10">
            <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-950 bg-clip-text text-transparent">
              KALINGA
            </span>
          </span>
        </HashLink>
      </div>
    </nav>
  );
};
