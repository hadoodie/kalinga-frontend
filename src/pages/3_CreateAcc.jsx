import CreateAcc from "../components/create-accs/CreateAccount";
import { NavbarB } from "../components/Navbar_2";

export const CreateAccount = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <NavbarB />
            
            {/* Create an Account */}
            <CreateAcc />
        </div>
    </div>
    );
}