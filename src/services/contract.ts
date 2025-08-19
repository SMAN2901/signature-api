import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getEnv } from "../env";

interface PrepareBody {
  emails: string[];
  fileId: string;
  title: string;
  signatureClass: number;
}

function buildPrepareBody({ emails, fileId, title, signatureClass }: PrepareBody) {
  const [ownerEmail] = emails;
  const signatories = emails.map((email) => {
    const namePart = email.split("@")[0];
    const [first = "", last = ""] = namePart.split(".");
    return {
      Email: email,
      ContractRole: 0,
      FirstName: first,
      LastName: last,
    };
  });
  return {
    TrackingId: uuidv4(),
    Title: title,
    ReturnDocument: true,
    ReceiveRolloutEmail: true,
    SignatureClass: signatureClass,
    OwnerEmail: ownerEmail,
    FileIds: [fileId],
    AddSignatoryCommands: signatories,
  };
}

export function buildPrepareContractRequest(body: PrepareBody) {
  const { baseUrl, prepareContractApi } = getEnv();
  const url = `${baseUrl}/${prepareContractApi}`;
  const payload = buildPrepareBody(body);
  return { url, body: payload };
}

export async function prepareContract(body: PrepareBody, token?: string) {
  const { url, body: payload } = buildPrepareContractRequest(body);
  const res = await axios.post(url, payload, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export function buildPrepareAndSendContractRequest(body: PrepareBody) {
  const { baseUrl, prepareAndSendContractApi } = getEnv();
  const url = `${baseUrl}/${prepareAndSendContractApi}`;
  const payload = buildPrepareBody(body);
  return { url, body: payload };
}

export async function prepareAndSendContract(body: PrepareBody, token?: string) {
  const { url, body: payload } = buildPrepareAndSendContractRequest(body);
  const res = await axios.post(url, payload, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export function buildSendContractRequest(body: any) {
  const { baseUrl, sendContractApi } = getEnv();
  const url = `${baseUrl}/${sendContractApi}`;
  return { url, body };
}

export async function sendContract(body: any, token?: string) {
  const { url, body: payload } = buildSendContractRequest(body);
  const res = await axios.post(url, payload, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function pollProcess(body: any, token?: string) {
  const { baseUrl, pollProcessApi } = getEnv();
  const url = `${baseUrl}/${pollProcessApi}`;
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}
