import {
  TCall,
  TCampaign,
  TCreateCallDTO,
  TCreateCampaignDTO,
  TPaginatedCampaigns,
} from "@/types";
import createDocument from "../firebase/createDocument";
import filterCollection, {
  Condition,
  SortOption,
} from "../firebase/filterCollection";
import getDocument from "../firebase/getDocument";
import getDocuments from "../firebase/getDocuments";
import editDocument from "../firebase/editDocument";
import getDocumentsByPage from "../firebase/getDocumentsByPage";

const getCampaigns = async (
  organisationId: string,
  limit: number | undefined = undefined
): Promise<TCampaign[]> => {
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

  const data = await filterCollection<TCampaign>(
    `campaigns`,
    conditions,
    sortOptions,
    limit
  );

  return data;
};

const getCampaignsAfter = async (
  organisationId: string,
  limit: number | undefined = undefined,
  lastVisibleDoc?: any
): Promise<TPaginatedCampaigns> => {
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

  const data = await getDocumentsByPage<TCampaign>(
    `campaigns`,
    conditions,
    sortOptions,
    limit,
    lastVisibleDoc
  );

  return {
    campaigns: data.data,
    lastVisibleDoc: data.lastVisible,
  };
};

const createCall = async (data: TCreateCallDTO) => {
  // Create a new customer
  const res: TCall = await createDocument<TCall>("calls", {
    ...data,
    // @ts-ignore
    createdAt: Math.round(Date.now() / 1000),
  });

  return res;
};

const updateCallField = async (callId: string, field: string, value: any) => {
  const res = await editDocument<TCall>("calls", callId, {
    [field]: value,
  });

  return res;
};

const createCampaign = async (
  data: TCreateCampaignDTO,
  calls: TCreateCallDTO[]
) => {
  // Create a new campaign

  const allPromise = calls.map((call) => createCall(call));
  const callsRes = await Promise.all(allPromise);

  const ids = callsRes.map((r) => r.uid);

  const dataFinal: Omit<TCampaign, "uid"> = {
    organisationId: data.organisationId,
    name: data.name,
    agentId: data.agentId,
    callIds: ids,
    createdAt: Date.now(),
    status: data.status,
    retryFailedCallsAfter: data.retryFailedCallsAfter,
    phone: data.phone,
    totalSkippedRecords: data.totalSkippedRecords
  };

  const res: TCampaign = await createDocument<Omit<TCampaign, "uid">>(
    "campaigns",
    dataFinal
  );

  // Update the call documents with the campaign id
  const updatePromises = callsRes.map((call) =>
    updateCallField(call.uid, "campaignId", res.uid)
  );

  return res;
};

const getCampaign = async (campaignId: string) => {
  const data = await getDocument<TCampaign>(`campaigns/${campaignId}`);
  return data;
};

const getCallsInCampaign = async (
  data: { campaignId: string } | { callIds: string[] }
) => {
  let callIds: string[] = [];
  if ("campaignId" in data) {
    const campaign = await getCampaign(data.campaignId);
    callIds = campaign.callIds;
  } else if ("callIds" in data) {
    callIds = data.callIds;
  }

  const res = await getDocuments<TCall>("calls", callIds);

  return res;
};

const getCallsAfterInCampaign = async (
  data: { campaignId: string },
  timestamp: number
) => {
  const campaign = await getCampaign(data.campaignId);

  const callIds = campaign.callIds;

  const res = await getDocuments<TCall>("calls", callIds);

  return res;
};

export {
  createCampaign,
  createCall,
  getCallsInCampaign,
  getCampaign,
  getCampaignsAfter,
  getCampaigns,
  updateCallField,
};
