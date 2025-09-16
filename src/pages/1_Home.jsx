import { AboutSection } from "../components/home/AboutSection";
import { Footer } from "../components/Footer";
import { HeroSection } from "../components/home/HeroSection";
import { MissionSection } from "../components/home/MissionSection";
import { DoctorsSection } from "../components/home/DoctorsSection";
import { NavbarA } from "../components/Navbar_1";
import { ContactSection } from "../components/home/Contact";

export const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            
            {/* Navbar */}
            <NavbarA />

            {/* Main Content */}

            <main>
                <HeroSection />
                <AboutSection />
                <MissionSection />
                <DoctorsSection />
                <ContactSection />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}