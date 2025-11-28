import { lazy } from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../config/routes";

// Lazy load public pages for better performance
const Home = lazy(() =>
  import("../pages-home/Home").then((module) => ({ default: module.Home }))
);
const LogIn = lazy(() =>
  import("../pages-account/LogIn").then((module) => ({ default: module.LogIn }))
);
const CreateAccount = lazy(() =>
  import("../pages-account/CreateAccount").then((module) => ({
    default: module.CreateAccount,
  }))
);
const ForgotPassword = lazy(() =>
  import("../pages-account/ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  }))
);
const PrivacyPolicy = lazy(() =>
  import("../pages-quicklinks/Policy")
);
const TermsAndConditions = lazy(() =>
  import("../pages-quicklinks/TermsAndConditions")
);
const Faqs = lazy(() =>
  import("../pages-quicklinks/FAQs")
);

export const PublicRoutes = () => (
  <>
    <Route index element={<Home />} />
    <Route path={ROUTES.LOGIN} element={<LogIn />} />
    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
    <Route path={ROUTES.CREATE_ACCOUNT} element={<CreateAccount />} />
    <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} /> 
    <Route path={ROUTES.TERMS_AND_CONDITIONS} element={<TermsAndConditions />} />
    <Route path={ROUTES.FAQS} element={<Faqs />} />
  </>
);
