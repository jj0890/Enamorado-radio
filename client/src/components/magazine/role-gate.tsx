import React from "react";

interface RoleGateProps {
  allowedRoles?: string[];
  adminOnly?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Simple role gate — always renders children in this build (admin auth is handled server-side) */
export function RoleGate({ children }: RoleGateProps) {
  return <>{children}</>;
}
