import { Navigate, Route, Routes, useNavigate } from "react-router";
import { EmptyState } from "@repo/multiverse-ui";
import Login from "./app/login/page";

const Public = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/logout"
        element={
          <EmptyState
            className="h-screen w-screen"
            heading="You have been logged out."
            message="Please login to continue."
            primaryAction={{
              label: "Return to Login",
              onClick: () => {
                navigate("/login");
              },
            }}
          />
        }
      />
      <Route
        path="*"
        element={
          <EmptyState
            className="h-screen w-screen"
            heading="Page not found"
            message="The page you are looking for does not exist."
            primaryAction={{
              label: "Return to Login",
              onClick: () => {
                navigate("/login");
              },
            }}
          />
        }
      />
    </Routes>
  );
};

export default Public;
