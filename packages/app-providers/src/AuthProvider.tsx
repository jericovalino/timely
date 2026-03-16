import { ToastContainer } from "react-toastify";
import React, { createContext, useCallback, useContext, useState } from "react";

import "react-toastify/dist/ReactToastify.css";

type AuthData = {
  token: string;
};

const AuthContext = createContext<
  | {
      authData:
        | {
            [K in keyof AuthData]: AuthData[K];
          }
        | null;
      setAuthData: (authData: AuthData | null) => void;
    }
  | undefined
>(undefined);

export const getInitialAuthData = (): AuthData | null => {
  try {
    return JSON.parse(localStorage.getItem("authData") ?? "");
  } catch (error) {
    return null;
  }
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authData, setAuthData] = useState<AuthData | null>(getInitialAuthData);
  const handleSetAuthData = useCallback(
    (authData: AuthData | null) => {
      localStorage.setItem("authData", JSON.stringify(authData));
      setAuthData(authData);
    },
    [setAuthData]
  );

  return (
    <AuthContext.Provider value={{ authData, setAuthData: handleSetAuthData }}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Invalid use.");
  return ctx;
};

export default AuthProvider;
