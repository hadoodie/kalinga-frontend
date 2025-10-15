import { cn } from "@/lib/utils";
import { Menu, X, UserCircle, LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { HashLink } from "react-router-hash-link";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/kalinga-logo.png";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../utils/roleRouting";

const navItems = [
  { name: "Home", href: "#hero" },
  { name: "About", href: "#about" },
  { name: "Our Doctors", href: "#doctors" },
  { name: "Contact Us", href: "#contact" },
];

export const NavbarA = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  return (
    <>
      <nav
        className={cn(
          "fixed w-full z-50 transition-all duration-300 border-b border-gray-200",
          isScrolled
            ? "py-3 bg-background backdrop-blur-md shadow-xs"
            : "py-5 bg-background"
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

            {/* User Profile or Sign In Button */}
            {isAuthenticated ? (
              <div className="relative ml-4" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors duration-300"
                >
                  <UserCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {user?.name || "User"}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Dashboard/Verification Button */}
                    {user?.verification_status === "verified" ? (
                      <Link
                        to={getDefaultRouteForRole(user?.role, user)}
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border-b border-gray-200"
                      >
                        <span>Go to Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        to="/verification-pending"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border-b border-gray-200"
                      >
                        <span>View Verification Status</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300"
              >
                Sign In
              </Link>
            )}
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

          {/* User Profile or Sign In Button */}
          {isAuthenticated ? (
            <div className="flex flex-col items-center gap-4 mt-4">
              {/* User Info Card */}
              <div className="bg-primary/5 border border-primary/30 rounded-lg px-6 py-4 text-center">
                <UserCircle className="w-16 h-16 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                {user?.role && (
                  <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
              </div>

              {/* Dashboard/Verification Button */}
              {user?.verification_status === "verified" ? (
                <Link
                  to={getDefaultRouteForRole(user?.role, user)}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300 text-lg text-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/verification-pending"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-6 py-2 rounded-lg border border-primary bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors duration-300 text-lg text-center"
                >
                  View Verification Status
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-300 text-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors duration-300 text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </>
  );
};
