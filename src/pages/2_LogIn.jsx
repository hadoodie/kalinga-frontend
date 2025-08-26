import LogInPage from "../components/login/LogIn";
import { Navbar } from "../components/Navbar";

export const LogIn = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <Navbar />
            
            {/* Log In */}
            <LogInPage />
        </div>
    </div>
    );
}

