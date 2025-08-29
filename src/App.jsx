import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/1_Home";
import { LogIn } from "./pages/2_LogIn";
import { CreateAccount } from "./pages/3_CreateAcc";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <>
    <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />}/>
          <Route path="/login" element={<LogIn />}/>
          <Route path="/createacc" element={<CreateAccount />}/>
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App; 