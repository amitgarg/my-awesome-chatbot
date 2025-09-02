// Simple feature flags with default values
export const DEFAULT_FEATURE_FLAGS = {
  enableChatTags: true,
} as const;

export type FeatureFlags = {
  enableChatTags: boolean;
};
