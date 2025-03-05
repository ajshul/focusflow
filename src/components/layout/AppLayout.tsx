import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <div className="h-screen bg-gray-100 flex flex-col">{children}</div>;
};

export default AppLayout;
