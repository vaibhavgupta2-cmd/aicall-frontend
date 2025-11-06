import { TAgent, TCreateAgentDTO } from "@/types";
import createDocument from "../firebase/createDocument";
import editDocument from "../firebase/editDocument";
import filterCollection, {
  Condition,
  SortOption,
} from "../firebase/filterCollection";
import getDocument from "../firebase/getDocument";

const getAgents = async (
  organisationId: string,
  limit: number | undefined = undefined
): Promise<TAgent[]> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
    {
      field: "isDeleted",
      operator: "==",
      value: false,
    },
  ];

  const sortOptions: SortOption[] = [
    {
      field: "createdAt",
      direction: "desc",
    },
  ];

  const data = await filterCollection<TAgent>(
    `agents`,
    conditions,
    sortOptions,
    limit
  );

  return data;
};

const getAgent = async (agentId: string) => {
  const data = await getDocument<TAgent>(`agents/${agentId}`);
  return data;
};

const editAgent = async (data: TAgent) => {
  const finalData = { ...data, uid: undefined };
  delete finalData.uid;

  // Edit a customer
  await editDocument<TCreateAgentDTO>(
    `agents`,
    data.uid,
    // don't include uid in the data
    finalData
  );

  return data;
};

const createAgent = async (data: TCreateAgentDTO) => {
  // Create a new customer
  const res: TAgent = await createDocument<
    TCreateAgentDTO & { createdAt: number } & { isDeleted: boolean }
  >("agents", { ...data, createdAt: Date.now(), isDeleted: false });

  return res;
};

const deleteAgent = async (agentId: string) => {
  // Delete a customer
  await editDocument<TAgent>("agents", agentId, {
    isDeleted: true,
  });
};

export { createAgent, editAgent, getAgent, getAgents, deleteAgent };
