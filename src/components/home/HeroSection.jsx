import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";

export const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center md:justify-start px-6 md:px-16 overflow-hidden"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl text-center md:text-left">
        <h1 className="text-3xl md:text-6xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in text-white">
          Mabilis at maaasahang emergency response system para sa bawat
          Pilipino.
        </h1>

        <p className="text-base md:text-xl text-gray-200 mb-8 max-w-lg mx-auto md:mx-0 opacity-0 animate-fade-in-delay-3">
          Teknolohiya para sa kaligtasan.
        </p>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 opacity-0 animate-fade-in-delay-4">
          <Link
            to={ROUTES.LOGIN}
            className="px-8 py-3 rounded-lg bg-white text-primary font-bold
                       hover:bg-white/90 hover:shadow-[0_0_10px_rgba(255,223,100,0.45)]
                       transition-all duration-300"
          >
            Log In
          </Link>
          <Link
            to={ROUTES.CREATE_ACCOUNT}
            className="px-8 py-3 rounded-lg border border-white/80 bg-white/10 text-white font-bold
                       hover:bg-white/20 hover:border-white
                       transition-all duration-300"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
};
