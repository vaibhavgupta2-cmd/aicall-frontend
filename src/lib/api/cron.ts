import { API_BASE_URL } from "./config";

export const triggerCallsCheck = async (campaignId: string) => {
  try {
    return fetch(
      process.env.NEXT_ENVIRONMENT == "DEV"
        ? "http://"
        : "https://" + `${API_BASE_URL}/api/process_calls/${campaignId}`
    );
  } catch (e) {
    console.log("triggerCallsCheck hit");
  }
};

export const triggermakecall = async () => {
  try {
    return fetch(
      process.env.NEXT_ENVIRONMENT == "DEV"
        ? "http://"
        : "https://" + `${API_BASE_URL}/api/process_call`
    );
  } catch (e) {
    console.log("triggerCallsCheck hit");
  }
};

export const retryFailedCalls = async (campaignId: string,delay_minutes:Number) => {
  try {
    return fetch(
      process.env.NEXT_ENVIRONMENT == "DEV"
        ? "http://"
        : "https://" + `${API_BASE_URL}/api/retry_calls/${campaignId}?delay_minutes=${delay_minutes}`
    );
  } catch (e) {
    console.log("retryCalls hit");
  }
};

export const retryCall = async (callId : string) => {
  try {
    return fetch(
      process.env.NEXT_ENVIRONMENT == "DEV"
        ? "http://"
        : "https://" + `${API_BASE_URL}/api/retry_call/${callId}`
    );
  } catch (e) {
    console.log("retryCalls hit");
  }
};
