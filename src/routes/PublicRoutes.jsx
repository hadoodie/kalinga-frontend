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

export const PublicRoutes = () => (
  <>
    <Route index element={<Home />} />
    <Route path={ROUTES.LOGIN} element={<LogIn />} />
    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
    <Route path={ROUTES.CREATE_ACCOUNT} element={<CreateAccount />} />
  </>
);
