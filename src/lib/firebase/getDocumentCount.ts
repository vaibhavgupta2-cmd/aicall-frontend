import { firestore } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

async function getDocumentsCountByIds<T>(
  path: string,
  ids: string[]
): Promise<{ completed: number; pending: number }> {
  if (ids.length === 0) {
    return {
      completed: 0,
      pending: 0,
    };
  }

  const collectionRef = collection(firestore, path);
  const batchSize = 10; // Firestore `in` operator limit

  let results = {
    completed: 0,
    pending: 0,
  };

  // Function to fetch documents in batches
  const fetchBatch = async (batchIds: string[]) => {
    const q = query(collectionRef, where("__name__", "in", batchIds));
    const querySnapshot = await getDocs(q);
    let completedCount = 0;
    let pendingCount = 0;

    // Iterate through the documents and count the statuses
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "COMPLETED") {
        completedCount++;
      } else if (data.status === "PEN") {
        pendingCount++;
      }
    });

    // Return the counts
    return {
      completed: completedCount,
      pending: pendingCount,
    };
  };

  // Split IDs into batches and fetch each batch
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const batchData = await fetchBatch(batchIds);
    results.completed += batchData.completed;
    results.pending += batchData.pending;
  }

  return results;
}

export default getDocumentsCountByIds;
