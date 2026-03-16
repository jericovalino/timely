import React from "react";
import { BrowserRouter } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

const BrowserRouterProvider = ({ children }: Props) => (
  <BrowserRouter>{children}</BrowserRouter>
);

export default BrowserRouterProvider;
