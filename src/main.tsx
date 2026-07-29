import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./pages/App";
import BossReport from "./pages/BossReport";
import Login from "./pages/Login";
import "./styles.css";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/boss", element: <BossReport /> },
  { path: "/*", element: <App /> }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
