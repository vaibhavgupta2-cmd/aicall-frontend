"use client";

import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Loading from "../Loading";
// @ts-ignore
type ProtectedRouteProps = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <Loading />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

