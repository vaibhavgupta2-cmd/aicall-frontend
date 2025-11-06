import { TUser } from "@/types";
import React from "react";

type UserRestrictedProps = {
  children: React.ReactNode;
  user: TUser | null;
  loginNeeded?: boolean;
};

function UserRestricted({ children, user, loginNeeded }: UserRestrictedProps) {
  if (loginNeeded && !user) {
    return null;
  }

  if (!loginNeeded && user) {
    return null;
  }

  // if (user.role !== role) {
  //   return null
  // }

  return <>{children}</>;
}

export default UserRestricted;

