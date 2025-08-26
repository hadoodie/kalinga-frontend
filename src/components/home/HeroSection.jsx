import { ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
    >
      <div className="container max-w-4xl mx-auto text-center z-10">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="opacity-0 animate-fade-in"> Mabilis at maaasahang emergency response system para sa bawat Pilipino.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-2-2xl mx-auto opacity-0 animate-fade-in-delay-3">
            Teknolohiya para sa kaligtasan.
          </p>

          <div className="pt-4 opacity-0 animate-fade-in-delay-4">
            <Link
              to="/login"
              className="button ml-4 px-4 py-2 rounded-lg bg-primary text-white font-medium 
                        hover:bg-primary hover:shadow-[0_0_10px_rgba(255,223,100,0.5)] transition-all duration-300">
              Report Emergency
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
        <span className="text-sm text-muted-foreground mb-2"> Scroll </span>
        <ArrowDown className="h-5 w-5 text-primary" />
      </div>
    </section>
  );
};
