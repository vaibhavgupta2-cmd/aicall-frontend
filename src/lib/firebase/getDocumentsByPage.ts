import { firestore } from "@/firebase/config";
import {
  QueryConstraint,
  WhereFilterOp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  startAfter,
} from "firebase/firestore";

export interface Condition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

async function getDocumentsByPage<T>(
  path: string,
  conditions: Condition[] = [],
  sortOptions: SortOption[] = [],
  limitNumber?: number,
  lastVisibleDoc?: any // last document from the previous page
) {
  const collectionRef = collection(firestore, path);

  let constraints: QueryConstraint[] = [];

  // Add sorting options to constraints
  sortOptions.forEach(({ field, direction }) => {
    constraints.push(orderBy(field, direction));
  });

  // Add conditions to constraints
  conditions.forEach(({ field, operator, value }) => {
    constraints.push(where(field, operator, value));
  });

  // Add pagination start point (lastVisibleDoc)
  console.log("lastVisibleDoc", lastVisibleDoc);

  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc)); // Continue after last document
  }

  // Add limit
  if (limitNumber) {
    constraints.push(limit(limitNumber));
  }

  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);

  // Map the query result to the expected data structure
  const data: T[] = querySnapshot.docs.map(
    (doc) => ({ ...doc.data(), uid: doc.id } as T)
  );

  // Get the last visible document to use for pagination
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { data, lastVisible };
}

export default getDocumentsByPage;
