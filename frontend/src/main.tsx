import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { UserAuthContextProvider } from "./context/userAuth.tsx";

createRoot(document.getElementById("root")!).render(
  <UserAuthContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </UserAuthContextProvider>
);
