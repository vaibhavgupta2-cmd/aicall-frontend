import { ExternalFunctionData } from "./components/ui/add-function-dialog";

type TFetched<T> =
  | {
      data?: T;
      error?: string;
      loading: true;
    }
  | {
      data: T;
      error: undefined;
      loading: false;
    }
  | {
      data?: T;
      error: string;
      loading: false;
    };

type TUser = {
  uid: string;
  email: string;
  name: string;
  organisationId: string;
  apiKey: string;
};

type WithoutUID<T> = Omit<T, "uid">;

type TCustomer = {
  uid: string;
  phone: string;
  name?: string;
  organisationId: string;
  addressLine1?: string;
  addressLine2?: string;
};

type TCreateCustomerDTO = Omit<TCustomer, "uid">;

enum LLMType {
  CHATGPT = "CHATGPT",
  LLAMA70B = "LLAMA70B",
  AZUREOPENAI = "AZUREOPENAI",
  CHATGPT4O = "CHATGPT4O",
  CHATGPT41MINI= "CHATGPT41MINI",
  CHATGPT41 = "CHATGPT41",
}

enum TTSType {
  NEETS = "NEETS",
  ELEVENLABS = "ELEVENLABS",
  POLLY = "POLLY",
  SMALLESTAI = "SMALLEST AI",
  AZURE = "AZURE",
}

enum STTType {
  AZURE = "AZURE",
  DEEPGRAM = "DEEPGRAM",
}

enum FillerWords {
  NONE = "NONE",
  HINDI = "HINDI",
  ENGLISH = "ENGLISH",
}

type TExtractionField = {
  name: string;
  description: string;
};

type TExtractedField = {
  name: string;
  value: string | number | boolean;
};

type TAgent = {
  uid: string;
  organisationId: string;
  name: string;
  isDeleted: boolean;
  description: string;
  promptTemplate: string;
  initialMessage: string;
  fields: TFieldUnfilled[];
  documents: string[];
  createdAt: number;
  llmType: LLMType;
  ttsType: TTSType;
  ttsVoice: string;
  sttType: STTType;
  fillerWords: string;
  sttLanguageId: string;
  extractionFields: TExtractionField[];
  actions: {
    endCall: boolean;
    transferCall: {
      phone: string;
      transferCall: boolean;
    };
    externalFunctions: ExternalFunctionData[];
  };
  ignoreUtterance: boolean;
  bgNoise: boolean;
  maxCallDuration: number;
  idleTimeout: number;
  modelId: string;
};

type TCreateAgentDTO = Omit<TAgent, "uid" | "createdAt" | "isDeleted">;

type TOrganisation = {
  uid: string;
  name: string;
  phoneNumbers: string[];
  Service_Provider: any;
};

type TFieldUnfilled = {
  name: string;
  type: string;
};

type TField = TFieldUnfilled & {
  value: string;
};

enum CampaignStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

type TCampaign = {
  uid: string;
  name: string;
  createdAt: number;
  organisationId: string;
  agentId: string;
  callIds: string[];
  status: CampaignStatus;
  retryFailedCallsAfter: number;
  phone:string;
  totalSkippedRecords:number
};

type TCreateCampaignDTO = Omit<TCampaign, "uid" | "createdAt">;

enum CallStatus {
  PENDING = "PENDING",
  RINGING = "RINGING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

type TPaginatedCalls = {
  calls: TCall[];
  lastVisibleDoc: any;
};

type TPaginatedCampaigns = {
  campaigns: TCampaign[];
  lastVisibleDoc: any;
};

type TCall = {
  uid: string;
  customerId: string;
  fields: TField[];
  organisationId: string;
  status: CallStatus;
  createdAt: number;
  timestamp?: number;
  record_url?: string;
  duration?: number;
  transcript?: string;
  failureReason?: string;
  agentId: string;
  extractionFieldsValues?: TExtractedField[];
  campaignId: string;
  callType: string;
  fromPhone: string;
};

type TCreateCallDTO = Omit<TCall, "uid" | "createdAt"> & {
  status: CallStatus.PENDING;
};
type TCreateCallADP = Omit<
  TCall,
  "uid" | "createdAt" | "fields" | "campaignId"
> & {
  status: CallStatus.PENDING;
};

type DropdownKey = {
  key: string;
  value: string;
};

export type {
  DropdownKey,
  TAgent,
  TCall,
  TPaginatedCalls,
  TCampaign,
  TPaginatedCampaigns,
  TCreateAgentDTO,
  TCreateCallDTO,
  TCreateCallADP,
  TCreateCampaignDTO,
  TCreateCustomerDTO,
  TCustomer,
  TExtractionField,
  TFetched,
  TField,
  TFieldUnfilled,
  TOrganisation,
  TUser,
  WithoutUID,
};

// so if SMALLESTAI = "SMALLEST AI"
// then getEnumFromString(TTSType, "SMALLEST AI") will return TTSType.SMALLESTAI

function getEnumFromString<T>(
  enumType: T,
  defaultValue: T[keyof T],
  key?: string
): T[keyof T] {
  if (!key) {
    return defaultValue;
  }

  // Convert the enum to a string-keyed object
  // @ts-ignore
  const entries = Object.entries(enumType).filter(
    ([k, v]) => typeof v === "string"
  );

  // Create a reverse lookup object
  const reverseLookup = Object.fromEntries(entries.map(([k, v]) => [v, k]));

  // Return the corresponding enum value or default if not found
  return reverseLookup[key]
    ? enumType[reverseLookup[key] as keyof T]
    : defaultValue;
}

// const getEnumFromString = <T>(
//   enumType: T,
//   defaultValue: T[keyof T],
//   value?: string
// ): T => {
//   // so if SMALLESTAI = "SMALLEST AI"
//   // then getEnumFromString(TTSType, "SMALLEST AI") will return TTSType.SMALLESTAI

//   // If no value is provided, return the default value

//   // Throw an error if no match is found
//   throw new Error(`Value '${value}' is not a valid enum value`);
// };

export {
  CallStatus,
  CampaignStatus,
  LLMType,
  STTType,
  TTSType,
  FillerWords,
  getEnumFromString,
};
