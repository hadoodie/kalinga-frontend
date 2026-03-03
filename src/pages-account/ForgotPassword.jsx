import { Footer } from "../components/Footer";
import { ForgotPW } from "../components/login/ForgotPW";
import { NavbarA } from "../components/Navbar_1";

export const ForgotPassword = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* Log In */}
            <ForgotPW />

            {/* Footer */}
            <Footer />
        </div>
    </div>
    );
}

