import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

import "./assets/styles/index.css";

import "@repo/multiverse-ui/multiverse-ui.css";
import "@repo/tailwindcss-config/global.css";
import {
  AuthProvider,
  BrowserRouterProvider,
  QueryProvider,
} from "@repo/app-providers";
import { OverlayProvider } from "@repo/multiverse-ui";
import { api } from "./utilities";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouterProvider>
      <AuthProvider>
        <QueryProvider api={api}>
          <OverlayProvider>
            <App />
          </OverlayProvider>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouterProvider>
  </StrictMode>
);
