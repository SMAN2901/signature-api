export type StepKey =
  | "intro"
  | "token"
  | "upload"
  | "prepare"
  | "send"
  | "done";

export interface StepState {
  status: "idle" | "running" | "success" | "error";
  request?: any;
  response?: any;
  error?: any;
  polling?: {
    isActive: boolean;
    logs: any[];
    last?: any;
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
  processId?: string;
  emails: string;
  actionChoice: "prepare" | "prepare_send";
  autoRun: boolean;
  autoDelayMs: number;
  simulate: boolean;
  steps: Record<StepKey, StepState>;
}

export type Action =
  | { type: "SET_FIELD"; key: keyof WizardState; value: any }
  | { type: "SET_STEP"; step: StepKey; patch: Partial<StepState> }
  | { type: "GOTO"; step: StepKey };
