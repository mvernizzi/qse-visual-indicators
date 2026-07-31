if (window.self !== window.top && window.TrelloPowerUp) {
  window.TrelloPowerUp.iframe();
}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if (window.self !== window.top && window.TrelloPowerUp) {
  window.TrelloPowerUp.iframe();
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);