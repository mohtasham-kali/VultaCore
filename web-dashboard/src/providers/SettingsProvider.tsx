"use client";

import { createContext, useContext, useState } from "react";

type ChartType = "pie" | "bar" | "line";

type AIModel = "gemini-pro" | "gpt-4o" | "claude-3-opus" | "meta-llama-3";

interface APIKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
}

interface SettingsContextType {
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  activeModel: AIModel;
  setActiveModel: (model: AIModel) => void;
  apiKeys: APIKeys;
  updateAPIKey: (provider: keyof APIKeys, key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [chartType, setChartType] = useState<ChartType>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("chartType") as ChartType) || "pie";
    }
    return "pie";
  });
  const [activeModel, setActiveModel] = useState<AIModel>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("activeModel") as AIModel) || "gemini-pro";
    }
    return "gemini-pro";
  });
  const [apiKeys, setApiKeys] = useState<APIKeys>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("apiKeys");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });


  const saveChartType = (type: ChartType) => {
    setChartType(type);
    localStorage.setItem("chartType", type);
  };

  const saveActiveModel = (model: AIModel) => {
    setActiveModel(model);
    localStorage.setItem("activeModel", model);
  };

  const updateAPIKey = (provider: keyof APIKeys, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newKeys);
    localStorage.setItem("apiKeys", JSON.stringify(newKeys));
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        chartType, 
        setChartType: saveChartType,
        activeModel,
        setActiveModel: saveActiveModel,
        apiKeys,
        updateAPIKey
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}
