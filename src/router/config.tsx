import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import FeeCalculator from "../pages/fee-calculator/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/fee-calculator",
    element: <FeeCalculator />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;