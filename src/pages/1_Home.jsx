import { AboutSection } from "../components/home/AboutSection";
import { Footer } from "../components/Footer";
import { HeroSection } from "../components/home/HeroSection";
import { MissionSection } from "../components/home/MissionSection";
import { DoctorsSection } from "../components/home/DoctorsSection";
import { NavbarA } from "../components/Navbar_1";

export const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            
            {/* Navbar */}
            <NavbarA />

            {/* Main Content */}

            <main>
                <HeroSection />
                <AboutSection />
                <DoctorsSection />
                <MissionSection />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}