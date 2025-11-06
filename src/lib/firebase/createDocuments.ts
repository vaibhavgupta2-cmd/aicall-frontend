import { firestore } from "@/firebase/config";
import { collection, doc, writeBatch } from "firebase/firestore";

interface DocumentData {
  uid?: string; // Optional ID field for custom document IDs
  [key: string]: any; // The document data
}

async function createDocuments<T extends DocumentData>(
  path: string,
  documents: T[]
) {
  const collectionRef = collection(firestore, path);
  const batch = writeBatch(firestore);

  documents.forEach((document) => {
    const docRef = document.uid
      ? doc(collectionRef, document.uid)
      : doc(collectionRef);
    const { uid, ...data } = document; // Exclude uid from document data
    batch.set(docRef, data);
  });

  try {
    await batch.commit();
    console.log("Batch write completed successfully");
  } catch (e) {
    console.error("Error writing batch: ", e);
    throw e;
  }

  return documents;
}

export default createDocuments;

