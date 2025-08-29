import CreateAcc from "../components/create-accs/CreateAccount";
import { Navbar } from "../components/Navbar";

export const CreateAccount = () => {
    return (
    <div>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <Navbar />
            
            {/* Create an Account */}
            <CreateAcc />
        </div>
    </div>
    );
}