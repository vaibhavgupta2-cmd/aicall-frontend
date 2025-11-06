"use client";

import useFirebaseUser from "@/hooks/firebase/useFirebaseUser";
import { TOrganisation, TUser } from "@/types";
import { createContext } from "react";

interface UserContextType {
  user: TUser | null;
  loading: boolean;
  organisation: TOrganisation | null;
  // setUser: Dispatch<SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  organisation: null,
});

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, organisation } = useFirebaseUser();
  return (
    <UserContext.Provider value={{ user, loading, organisation }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;

