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

async function filterCollection<T>(
  path: string,
  conditions: Condition[] = [],
  sortOptions: SortOption[] = [],
  limitNumber?: number
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

  if (limitNumber) {
    constraints.push(limit(limitNumber));
  }

  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const data: T[] = querySnapshot.docs.map(
    (doc) => ({ ...doc.data(), uid: doc.id } as T)
  );

  return data;
}


export default filterCollection;

