// Core Types for Manga Text Processor Extension

export interface ExtensionSettings {
  serverUrl: string;
  apiKeys: string[];
  translateModel: string;
  targetLanguage: string;
  fontSource: string;
  fontFamily: string;
  googleFontFamily: string;
  includeFreeText: boolean;
  bananaMode: boolean;
  textStroke: boolean;
  backgroundType: string;
  cache: boolean;
  metricsDetail: boolean;
  geminiThinking: boolean;
  tighterBounds: boolean;
  filterOrphanRegions: boolean;
  useMask?: boolean;  // Enable/disable mask segmentation
  maskMode?: string;  // 'off' | 'fast' (accurate mode removed)
  mergeImg: boolean;
  batchSize: number;
  sessionLimit: number;
  targetSize: number;
  theme?: 'light' | 'dark' | 'auto';
  l1Debug?: boolean;  // Debug mode: show label 0/1 bounding boxes
  localOcr?: boolean;  // Use local OCR model instead of Gemini
  useCerebras?: boolean;  // Use Cerebras API for translation (when localOcr=true)
  cerebrasApiKey?: string;  // Cerebras API key
}

export interface ProcessConfig {
  serverUrl: string;
  apiKeys: string[];
  translateModel: string;
  targetLanguage: string;
  fontSource: string;
  fontFamily: string;
  googleFontFamily: string;
  includeFreeText: boolean;
  bananaMode: boolean;
  textStroke: boolean;
  backgroundType: string;
  cache: boolean;
  metricsDetail: boolean;
  geminiThinking: boolean;
  tighterBounds: boolean;
  filterOrphanRegions: boolean;
  useMask?: boolean;  // Enable/disable mask segmentation
  maskMode?: string;  // 'off' | 'fast' (accurate mode removed)
  mergeImg: boolean;
  batchSize: number;
  sessionLimit: number;
  targetSize: number;
  l1Debug?: boolean;  // Debug mode: show label 0/1 bounding boxes
  localOcr?: boolean;  // Use local OCR model instead of Gemini
  useCerebras?: boolean;  // Use Cerebras API for translation (when localOcr=true)
  cerebrasApiKey?: string;  // Cerebras API key
}

export interface Analytics {
  total_images?: number;
  total_regions?: number;
  simple_bg_count?: number;
  complex_bg_count?: number;
  label_0_count?: number;
  label_1_count?: number;
  label_2_count?: number;
  api_calls_simple?: number;
  api_calls_complex?: number;
  api_calls_banana?: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_hits?: number;
  cache_misses?: number;
  phase1_time_ms?: number;
  phase2_time_ms?: number;
  phase3_time_ms?: number;
  phase4_time_ms?: number;
  total_time_ms?: number;
}

export interface ProcessResult {
  processed: number;
  analytics?: Analytics;
}

export interface ServerResult {
  results?: Array<{
    success: boolean;
    data_url?: string;
  }>;
  analytics?: Analytics;
}

export type ConnectionStatus = 'connected' | 'checking' | 'error';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Message {
  action: string;
  config?: ProcessConfig;
  progress?: number;
  details?: string;
  analytics?: Analytics;
  error?: string;
  result?: ProcessResult;
  url?: string;
}

export type Theme = 'light' | 'dark';
export type Tab = 'settings' | 'apiKeys' | 'stats';
