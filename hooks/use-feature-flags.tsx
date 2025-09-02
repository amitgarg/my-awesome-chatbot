"use client";

import { createContext, useContext, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { FeatureFlags } from "@/lib/feature-flags";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/feature-flags";

interface FeatureFlagsContextType {
  flags: FeatureFlags;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

function FeatureFlagsProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();

  const flags = useMemo(() => {
    const urlEnableChatTags = searchParams.get("enableChatTags");

    return {
      ...DEFAULT_FEATURE_FLAGS,
      enableChatTags:
        urlEnableChatTags !== null
          ? urlEnableChatTags === "true"
          : DEFAULT_FEATURE_FLAGS.enableChatTags,
    };
  }, [searchParams]);

  return (
    <FeatureFlagsContext.Provider value={{ flags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function FeatureFlagsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <FeatureFlagsContext.Provider value={{ flags: DEFAULT_FEATURE_FLAGS }}>
          {children}
        </FeatureFlagsContext.Provider>
      }
    >
      <FeatureFlagsProviderInner>{children}</FeatureFlagsProviderInner>
    </Suspense>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return context.flags;
}

export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[flagName];
}
