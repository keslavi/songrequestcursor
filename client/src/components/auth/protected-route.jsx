import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "@/store";

export const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = store.use.isAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
}; 