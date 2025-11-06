import { firestore } from "@/firebase/config";
import { WithoutUID } from "@/types";
import { addDoc, collection } from "firebase/firestore";

async function createDocument<T extends { [x: string]: any }>(
  path: string,
  data: WithoutUID<T>
) {
  const collectionRef = collection(firestore, path);

  try {
    const docRef = await addDoc(collectionRef, data);
    return {
      uid: docRef.id,
      ...data,
    };
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}

export default createDocument;
