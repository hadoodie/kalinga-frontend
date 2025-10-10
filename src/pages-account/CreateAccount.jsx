import CreateAcc from "../components/create-accs/CreateAccount";
import { Footer } from "../components/Footer";
import { NavbarA } from "../components/Navbar_1";

export const CreateAccount = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarA />
            
            {/* Create an Account */}
            <CreateAcc />

            {/* Footer */}
            <Footer />
        </div>
    </div>
    );
}