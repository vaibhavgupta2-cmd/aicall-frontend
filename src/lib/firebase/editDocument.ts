import { firestore } from "@/firebase/config";
import { doc, updateDoc } from "firebase/firestore";

async function editDocument<T>(path: string, id: string, data: Partial<T>) {
  const docRef = doc(firestore, path, id);

  try {
    await updateDoc(docRef, data);
    console.log("Document updated successfully");
  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
}

export default editDocument;

