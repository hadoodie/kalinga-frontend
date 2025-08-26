import { AboutSection } from "../components/home/AboutSection";
import { Footer } from "../components/Footer";
import { HeroSection } from "../components/home/HeroSection";
import { Navbar } from "../components/Navbar";
import { MissionSection } from "../components/home/MissionSection";
import { DoctorsSection } from "../components/home/DoctorsSection";

export const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            
            {/* Navbar */}
            <Navbar />

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