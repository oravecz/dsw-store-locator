import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorkerUpdates } from "./lib/serviceWorker";
import "./styles.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void registerServiceWorkerUpdates().catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
