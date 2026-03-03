import { NavbarB } from "../components/Navbar_2";
import { Footer } from "../components/Footer";
import TermsAndConds from "../components/TermsAndConditions";

export default function TermsAndConditions() {

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 transition-all duration-300">
        {/* Navbar*/}
        <div className="sticky top-0 z-10 bg-background"> 
          <NavbarB />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto ">
          <TermsAndConds />
          <Footer />
        </main>
      </div>
    </div>
  );
};