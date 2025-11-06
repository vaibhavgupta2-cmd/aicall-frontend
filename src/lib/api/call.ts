import { TCall, TCreateCallADP, TPaginatedCalls } from "@/types";
import filterCollection, {
  Condition,
  SortOption,
} from "../firebase/filterCollection";
import getDocument from "../firebase/getDocument";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase/config";
import getDocumentsByPage from "../firebase/getDocumentsByPage";
import createDocument from "../firebase/createDocument";
// import { getDocumentsByIdPart } from "../firebase/filterCollection";

const getCall = async (id: string) => {
  const data = await getDocument<TCall>(`calls/${id}`);
  return data;
};

const getCalls = async (
  organisationId: string,
  limit: number | undefined = undefined
): Promise<TCall[]> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await filterCollection<TCall>(
    `calls`,
    conditions,
    sortOptions,
    limit
  );

  return data;
};

const getPendingCallsAfter = async (
  organisationId: string,
  limit: number | undefined = undefined,
  lastVisibleDoc?: any
): Promise<TPaginatedCalls> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
    {
      field: "status",
      operator: "==",
      value: "PENDING",
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await getDocumentsByPage<TCall>(
    `calls`,
    conditions,
    sortOptions,
    limit,
    lastVisibleDoc
  );

  return { calls: data.data, lastVisibleDoc: data.lastVisible };
};

//write a function to get calls which are != a certain status as input before a certain date and time
const getOtherCallsAfter = async (
  organisationId: string,
  limit: number | undefined = undefined,
  status: string,
  lastVisibleDoc?: any
): Promise<TPaginatedCalls> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
    {
      field: "status",
      operator: "!=",
      value: status,
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await getDocumentsByPage<TCall>(
    `calls`,
    conditions,
    sortOptions,
    limit,
    lastVisibleDoc
  );

  return { calls: data.data, lastVisibleDoc: data.lastVisible };
};

async function getDocumentsByIdPart<T>(
  path: string,
  idPart: string,
  field: string,
  organisationId: string
): Promise<T[]> {
  try {
    const collectionRef = collection(firestore, path);
    const querySnapshot = await getDocs(collectionRef);
    var data = [];

    for (const doc of querySnapshot.docs) {
      if (
        doc.data()[field] &&
        doc.data()[field].includes(idPart) &&
        doc.data()["organisationId"] == organisationId
      ) {
        data.push({ ...doc.data(), uid: doc.id } as T);
      }
    }
    console.log(data);

    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

const createCallADP = async (data: TCreateCallADP) => {
  // Create a new customer
  const res: TCall = await createDocument<TCall>("calls", {
    ...data, // add a default value or retrieve it from somewhere
    fields: [], // add a default value or retrieve it from somewhere
    campaignId: "", // add a default value or retrieve it from somewhere
    createdAt: Math.round(Date.now() / 1000),
  });

  return res;
};

const getCallsBetween = async (
  organisationId: string,
  startDate: Date,
  endDate: Date
): Promise<TCall[]> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
    {
      field: "createdAt",
      operator: ">=",
      value: startDate.getTime() / 1000,
    },
    {
      field: "createdAt",
      operator: "<=",
      value: endDate.getTime() / 1000,
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await filterCollection<TCall>(
    `calls`,
    conditions,
    sortOptions,
    undefined
  );

  return data;
};

const getCallsByAgent = async (
  agentId: string
  // limit: number | undefined = undefined
): Promise<TCall[]> => {
  const conditions: Condition[] = [
    {
      field: "agentId",
      operator: "==",
      value: agentId,
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await filterCollection<TCall>(`calls`, conditions, sortOptions);
  console.log(data);

  return data;
};

export {
  getCall,
  getCalls,
  createCallADP,
  getDocumentsByIdPart,
  getCallsBetween,
  getPendingCallsAfter,
  getOtherCallsAfter,
  getCallsByAgent,
};
