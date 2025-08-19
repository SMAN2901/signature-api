import axios from "axios";

export async function prepareContract(url: string, body: any, token?: string) {
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function prepareAndSendContract(url: string, body: any, token?: string) {
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function sendContract(url: string, body: any, token?: string) {
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function pollProcess(url: string, body: any, token?: string) {
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}
