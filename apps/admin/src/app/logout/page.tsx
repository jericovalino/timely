import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthContext } from "@repo/app-providers";

const Logout = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuthContext();

  useEffect(() => {
    setAuthData(null);
    navigate("/login", { replace: true });
  }, [setAuthData, navigate]);

  return null;
};

export default Logout;
