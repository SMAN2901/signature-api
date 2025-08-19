import development from "./development";
import staging from "./staging";
import production from "./production";

export type Environment = "development" | "staging" | "production";

export interface EnvConfig {
  baseUrl: string;
  tokenApi: string;
  getUploadUrlApi: string;
  pollUploadStatusApi: string;
  prepareContractApi: string;
  prepareAndSendContractApi: string;
  sendContractApi: string;
  pollProcessApi: string;
}

const configs: Record<Environment, EnvConfig> = {
  development,
  staging,
  production,
};

export function getEnv(): EnvConfig {
  if (typeof window !== "undefined") {
    const stored = (localStorage.getItem("environment") as Environment) || "development";
    return configs[stored] || development;
  }
  return development;
}
