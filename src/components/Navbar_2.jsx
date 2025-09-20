import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { HashLink } from "react-router-hash-link";
import { Search } from "lucide-react";
import logo from "../assets/kalinga-logo.png";

export const NavbarB = ({collapsed}) => {
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
        isScrolled ? "py-3 bg-background backdrop-blur-md shadow-xs" : "py-5 bg-background",
        collapsed ? "pl-0" : "pl--0"
      )}
    >
      <div className="container flex items-center justify-between pl-2 ">
        {/* Left: Logo */}
        <HashLink smooth to="/#hero" className="flex items-left">
          <img src={logo} alt="Kalinga Logo" className="h-10 w-auto" />
        </HashLink>
      </div>
    </nav>
  );
};
