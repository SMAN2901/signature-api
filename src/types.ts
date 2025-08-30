export type StepKey =
  | "intro"
  | "token"
  | "uploadUrl"
  | "upload"
  | "prepare"
  | "send"
  | "done";

export interface StepState {
  status: "idle" | "running" | "success" | "error";
  request?: unknown;
  response?: unknown;
  error?: unknown;
  polling?: {
    isActive: boolean;
    logs: unknown[];
  };
}

export interface WizardState {
  current: StepKey;
  environment: "development" | "staging" | "production";
  clientId: string;
  clientSecret: string;
  token?: string;
  file?: File | null;
  fileName?: string;
  uploadUrl?: string;
  fileId?: string;
  documentId?: string;
  title: string;
  signatureClass: number;
  emails: string;
  actionChoice: "prepare" | "prepare_send";
  autoRun: boolean;
  autoDelayMs: number;
  steps: Record<StepKey, StepState>;
}

export type Action =
  | { type: "SET_FIELD"; key: keyof WizardState; value: WizardState[keyof WizardState] }
  | { type: "SET_STEP"; step: StepKey; patch: Partial<StepState> }
  | { type: "GOTO"; step: StepKey };
