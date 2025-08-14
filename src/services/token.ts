import axios from "axios";
import { getEnv } from "../env";

export function buildTokenRequest(clientId: string, clientSecret: string) {
  const { baseUrl, tokenApi } = getEnv();
  const url = `${baseUrl}/${tokenApi}`;
  const body = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  };
  return { url, body, baseUrl };
}

export async function getToken(clientId: string, clientSecret: string) {
  const { url, body, baseUrl } = buildTokenRequest(clientId, clientSecret);
  const params = new URLSearchParams(body);
  const res = await axios.post(url, params, {
    headers: {
      Origin: baseUrl,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.data;
}
