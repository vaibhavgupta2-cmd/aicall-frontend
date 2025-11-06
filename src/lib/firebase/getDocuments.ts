import { firestore } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

async function getDocumentsByIds<T>(path: string, ids: string[]): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const collectionRef = collection(firestore, path);
  const batchSize = 10; // Firestore `in` operator limit
  let results: T[] = [];
  console.log("ids", ids[0]);

  // Function to fetch documents in batches
  const fetchBatch = async (batchIds: string[]) => {
    const q = query(collectionRef, where("__name__", "in", batchIds));
    const querySnapshot = await getDocs(q);
    const data: T[] = querySnapshot.docs.map((doc) => {
      return {
        uid: doc.id,
        ...doc.data(),
      };
    }) as T[];
    return data;
  };

  // Split IDs into batches and fetch each batch
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const batchData = await fetchBatch(batchIds);
    results = results.concat(batchData);
  }

  return results;
}

export default getDocumentsByIds;
