import axios from "axios";

export function buildGetUploadUrlBody(itemId: string, name: string) {
  return {
    ItemId: itemId,
    MetaData: "{}",
    Name: name,
    ParentDirectoryId: "",
    Tags: '["File"]',
  };
}

export async function getUploadUrl(url: string, itemId: string, name: string, token?: string) {
  const body = buildGetUploadUrlBody(itemId, name);
  const res = await axios.post(url, body, {
    headers: token ? { Authorization: `bearer ${token}` } : undefined,
  });
  return res.data;
}

export async function uploadFile(url: string, file: Blob | ArrayBuffer) {
  const res = await axios.put(url, file);
  return { status: res.status };
}

export async function pollUploadStatus(url: string, fileId: string) {
  const res = await axios.post(url, { fileId });
  return res.data;
}
