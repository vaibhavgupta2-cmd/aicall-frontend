"use client";
import AnonymousRoute from "@/components/routes/AnonymousRoute";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import { usePathname } from "next/navigation";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();
  const layoutFreeRoutes = ["/embed"];

  if (pathName.includes("/embed") || pathName.includes("/talk")) {
    return <>{children}</>; // Render children directly, no layout
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
