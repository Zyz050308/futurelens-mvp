"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "futurelens-identity";
const CUSTOM_IDENTITY_KEY = "futurelens-custom-identity";

export type IdentityOption =
  | "entrepreneur"
  | "learner"
  | "professional"
  | "creator"
  | "custom";

export interface Identity {
  id: IdentityOption;
  label: string;
  description: string;
}

export const IDENTITIES: Identity[] = [
  {
    id: "entrepreneur",
    label: "AI创业者",
    description: "关注AI创业机会和商业应用",
  },
  {
    id: "learner",
    label: "AI学习者",
    description: "追踪AI技术发展和学习资源",
  },
  {
    id: "professional",
    label: "职场人",
    description: "了解AI对职业的影响和机遇",
  },
  {
    id: "creator",
    label: "自媒体人",
    description: "掌握AI创作工具和内容趋势",
  },
  {
    id: "custom",
    label: "自定义身份",
    description: "根据你的特定需求定制",
  },
];

export function getCustomIdentityLabel(): string {
  if (typeof window === "undefined") return "自定义身份";
  try {
    return localStorage.getItem(CUSTOM_IDENTITY_KEY) || "自定义身份";
  } catch {
    return "自定义身份";
  }
}

export function saveCustomIdentity(label: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_IDENTITY_KEY, label);
  } catch {}
}

export function useIdentity() {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (saved === "custom") {
        // 自定义身份：从 localStorage 读取用户输入的真实身份
        const customLabel = localStorage.getItem(CUSTOM_IDENTITY_KEY) || "自定义身份";
        setSelectedIdentity({
          id: "custom",
          label: customLabel,
          description: "根据你的特定需求定制",
        });
      } else {
        const identity = IDENTITIES.find((id) => id.id === saved);
        if (identity) {
          setSelectedIdentity(identity);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const selectIdentity = (identity: Identity) => {
    setSelectedIdentity(identity);
    localStorage.setItem(STORAGE_KEY, identity.id);
  };

  const selectCustomIdentity = (customLabel: string) => {
    saveCustomIdentity(customLabel);
    setSelectedIdentity({
      id: "custom",
      label: customLabel,
      description: "根据你的特定需求定制",
    });
    localStorage.setItem(STORAGE_KEY, "custom");
  };

  const clearIdentity = () => {
    setSelectedIdentity(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_IDENTITY_KEY);
  };

  return {
    selectedIdentity,
    isLoading,
    selectIdentity,
    selectCustomIdentity,
    clearIdentity,
  };
}
