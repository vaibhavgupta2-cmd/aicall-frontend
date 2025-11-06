import { firestore } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

async function getDocument<T>(path: string) {
  const docRef = doc(firestore, path);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document does not exist");
  }

  // @ts-ignore
  const data: T = docSnap.data();

  return { ...data, uid: docSnap.id };
}

export default getDocument;

