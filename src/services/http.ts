import axios from "axios";

axios.interceptors.request.use((config) => {
  const cachebuster = Date.now();
  if (config.params instanceof URLSearchParams) {
    config.params.set("cachebuster", cachebuster.toString());
  } else {
    const params = config.params as Record<string, unknown> | undefined;
    config.params = { ...(params ?? {}), cachebuster };
  }
  return config;
});

export default axios;
