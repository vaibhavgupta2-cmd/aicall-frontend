import { TCreateCustomerDTO, TCustomer } from "@/types";
import createDocument from "../firebase/createDocument";
import createDocuments from "../firebase/createDocuments";
import editDocument from "../firebase/editDocument";
import filterCollection, { Condition } from "../firebase/filterCollection";
import getDocument from "../firebase/getDocument";

const setCustomerUid = (data: TCreateCustomerDTO): TCustomer => {
  return { ...data, uid: `customer_${data.organisationId}_${data.phone}` };
};

const getCustomers = async (
  organisationId: string,
  limit: number | undefined = undefined
): Promise<TCustomer[]> => {
  const conditions: Condition[] = [
    {
      field: "organisationId",
      operator: "==",
      value: organisationId,
    },
  ];

  const data = await filterCollection<TCustomer>(
    `customers`,
    conditions,
    [],
    limit
  );

  return data;
};

const getCustomer = async (customerId: string) => {
  const data = await getDocument<TCustomer>(`customers/${customerId}`);
  return data;
};

const createCustomer = async (data: TCreateCustomerDTO) => {
  // Create a new customer
  const res: TCustomer = await createDocument<TCustomer>(
    "customers",
    setCustomerUid(data)
  );

  return res;
};

const createCustomers = async (data: TCreateCustomerDTO[]) => {
  // Create a new customer
  const res = await createDocuments<TCustomer>(
    "customers",
    data.map(setCustomerUid)
  );

  return data.map(setCustomerUid);
};

const editCustomer = async (data: TCustomer) => {
  const finalData = { ...data, uid: undefined };
  delete finalData.uid;

  // Edit a customer
  await editDocument<TCreateCustomerDTO>(
    `customers`,
    data.uid,
    // don't include uid in the data
    finalData
  );

  return data;
};

export {
  createCustomer,
  createCustomers,
  editCustomer,
  getCustomer,
  getCustomers,
};

