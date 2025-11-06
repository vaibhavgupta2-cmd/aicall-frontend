"use client";

import UserContext from "@/context/UserContext";
import { useContext } from "react";

function useUser() {
  const data = useContext(UserContext);
  return data;
}

export default useUser;

