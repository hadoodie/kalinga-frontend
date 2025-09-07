import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/1_Home";
import { LogIn } from "./pages/2_LogIn";
import { CreateAccount } from "./pages/3_CreateAcc";
import { Toaster } from "./components/ui/toaster";
import { VerifyIDs } from "./pages/4_VerifyID";
import { UploadIDs } from "./pages/5_UploadID";
import { FillInformation } from "./pages/6_FillInformation";

function App() {
  return (
    <>
    <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />}/>
          <Route path="/login" element={<LogIn />}/>
          <Route path="/create-acc" element={<CreateAccount />}/>
          <Route path="/verify-id" element={<VerifyIDs />}/>
          <Route path="/upload-id" element={<UploadIDs />}/>
          <Route path="/fill-info" element={<FillInformation />}/>
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App; 