import { Footer } from "../components/Footer";
import LogInPage from "../components/login/LogIn";
import { NavbarA } from "../components/Navbar_1";

export const LogIn = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* Log In */}
            <LogInPage />

            {/* Footer */}
            <Footer />
        </div>
    </div>
    );
}

