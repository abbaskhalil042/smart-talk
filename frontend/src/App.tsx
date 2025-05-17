import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoutes from "./auth/ProtectedRoutes";
import Projects from "./pages/Projects";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected route */}
      <Route
        path="/"
        element={
          <ProtectedRoutes>
            <Home />
          </ProtectedRoutes>
        }
      />

      <Route
        path="/project"
        element={
          <ProtectedRoutes>
            <Projects />
          </ProtectedRoutes>
        }
      />
    </Routes>
  );
}

export default App;
