"use client";

import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

type AnonymousRouteProps = {
  children: React.ReactNode;
};

const AnonymousRoute: React.FC<AnonymousRouteProps> = ({ children }) => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return <>{children}</>;
};

export default AnonymousRoute;

