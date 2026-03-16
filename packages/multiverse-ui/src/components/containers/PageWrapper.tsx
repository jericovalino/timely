import React from "react";

import { cn } from "../../utilities";

type PageWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

const PageWrapper = ({ children, className }: PageWrapperProps) => {
  return (
    <div
      className={cn(
        "bg-white flex-grow p-6 rounded-lg border shadow h-full",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default PageWrapper;
