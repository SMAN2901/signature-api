import axios from "axios";
import { getEnv } from "../env";

export function buildPrepareContractRequest(body: any) {
  const { baseUrl, prepareContractApi } = getEnv();
  const url = `${baseUrl}/${prepareContractApi}`;
  return { url, body };
}

export async function prepareContract(body: any, token?: string) {
  const { url, body: payload } = buildPrepareContractRequest(body);
  const res = await axios.post(url, payload, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export function buildPrepareAndSendContractRequest(body: any) {
  const { baseUrl, prepareAndSendContractApi } = getEnv();
  const url = `${baseUrl}/${prepareAndSendContractApi}`;
  return { url, body };
}

export async function prepareAndSendContract(body: any, token?: string) {
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
