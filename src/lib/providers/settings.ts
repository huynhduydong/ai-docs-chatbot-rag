import { LocalProvider } from "./local";
import { OpenAICompatibleProvider } from "./openai";
import type { LLMProvider } from "./types";

export type ProviderKind = "local" | "openai";

export interface AppSettings {
  provider: ProviderKind;
  apiKey: string;
  baseUrl: string;
  model: string;
  topK: number;
  hybrid: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: "local",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  topK: 5,
  hybrid: true,
};

const STORAGE_KEY = "documind:settings:v1";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage disabled */
  }
}

export function createProvider(s: AppSettings): LLMProvider {
  if (s.provider === "openai" && s.apiKey.trim()) {
    return new OpenAICompatibleProvider({ apiKey: s.apiKey.trim(), baseUrl: s.baseUrl.trim(), model: s.model.trim() });
  }
  return new LocalProvider();
}
