import React from "react";

// Maintenance gate disabled — always passes children through.
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default MaintenanceGate;
