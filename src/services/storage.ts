import axios from "axios";
import { getEnv } from "../env";

function buildGetUploadUrlBody(itemId: string, name: string) {
  return {
    ItemId: itemId,
    MetaData: "{}",
    Name: name,
    ParentDirectoryId: "",
    Tags: '["File"]',
  };
}

export function buildGetUploadUrlRequest(itemId: string, name: string) {
  const { baseUrl, getUploadUrlApi } = getEnv();
  const url = `${baseUrl}/${getUploadUrlApi}`;
  const body = buildGetUploadUrlBody(itemId, name);
  return { url, body };
}

export async function getUploadUrl(itemId: string, name: string, token?: string) {
  const { url, body } = buildGetUploadUrlRequest(itemId, name);
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function uploadFile(url: string, file: Blob | ArrayBuffer) {
  const res = await axios.put(url, file, {
    headers: { 'x-ms-blob-type': 'BlockBlob'}
  });
  return { status: res.status };
}

export async function pollUploadStatus(fileId: string) {
  const { baseUrl, pollUploadStatusApi } = getEnv();
  const url = `${baseUrl}/${pollUploadStatusApi}`;
  const res = await axios.post(url, { fileId });
  return res.data;
}
