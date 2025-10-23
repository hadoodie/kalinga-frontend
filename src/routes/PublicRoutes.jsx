import { lazy } from "react";
import { Route } from "react-router-dom";
import { ROUTES } from "../config/routes";

// Lazy load public pages for better performance
const Home = lazy(() => import("../pages-home/Home"));
const LogIn = lazy(() => import("../pages-account/LogIn"));
const CreateAccount = lazy(() => import("../pages-account/CreateAccount"));
const ForgotPassword = lazy(() => import("../pages-account/ForgotPassword"));

export const PublicRoutes = () => (
  <>
    <Route index element={<Home />} />
    <Route path={ROUTES.LOGIN} element={<LogIn />} />
    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
    <Route path={ROUTES.CREATE_ACCOUNT} element={<CreateAccount />} />
  </>
);
