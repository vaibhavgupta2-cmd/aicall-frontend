"use client";

import { auth, firestore } from "@/firebase/config";
import { TOrganisation, TUser } from "@/types";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

function useFirebaseUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userData, setUserData] = useState<{
    loading: boolean;
    user: TUser | null;
    organisation: TOrganisation | null;
  }>({ loading: true, user: null, organisation: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user === null) {
        setUserData({
          loading: false,
          user: null,
          organisation: null,
        });
        return;
      }

      // We wait here?
      if (user === undefined) {
        return;
      }

      if (userData.user?.uid === user.uid) {
        return;
      }

      setUserData({
        loading: true,
        user: null,
        organisation: null,
      });

      try {
        // Define the Firestore collection and query
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.log(
            `No such document, for user id ${user?.uid} (in teams DB)`
          );

          setUserData({
            loading: false,
            user: null,
            organisation: null,
          });

          return;
        }

        // @ts-ignore
        const data: TUser = docSnap.data();

        const organisationRef = doc(
          firestore,
          "organisations",
          data.organisationId
        );

        const organisationSnap = await getDoc(organisationRef);

        if (!organisationSnap.exists()) {
          console.log(
            `No such document, for organisation id ${data.organisationId} (in teams DB)`
          );

          setUserData({
            loading: false,
            user: {
              uid: user.uid,
              email: user.email!,
              name: data.name,
              organisationId: data.organisationId,
              apiKey: data.apiKey,
            },
            organisation: null,
          });

          return;
        }

        // @ts-ignore
        const organisation: TOrganisation = organisationSnap.data();

        setUserData({
          user: {
            uid: user.uid,
            email: user.email!,
            name: data.name,
            organisationId: data.organisationId,
            apiKey: data.apiKey,
          },
          organisation: {
            uid: data.organisationId,
            name: organisation.name,
            phoneNumbers: organisation.phoneNumbers,
            Service_Provider: organisation.Service_Provider,
          },
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);

        setUserData({
          loading: false,
          user: null,
          organisation: null,
        });
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    user: userData.user,
    loading: userData.loading,
    organisation: userData.organisation,
  };
}

export default useFirebaseUser;

