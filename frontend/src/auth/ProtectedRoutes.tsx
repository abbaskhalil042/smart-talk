import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuthContext } from "../context/userAuth";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useContext(UserAuthContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      navigate("/signin");
    } else {
      setLoading(false);
    }
  }, [user, token, navigate]); // Watch for changes

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
