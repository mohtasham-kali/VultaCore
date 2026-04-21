"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [activeModel, setActiveModel] = useState<AIModel>("gemini-pro");
  const [apiKeys, setApiKeys] = useState<APIKeys>({});

  useEffect(() => {
    const savedChart = localStorage.getItem("chartType") as ChartType;
    if (savedChart) setChartType(savedChart);

    const savedModel = localStorage.getItem("activeModel") as AIModel;
    if (savedModel) setActiveModel(savedModel);

    const savedKeys = localStorage.getItem("apiKeys");
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
  }, []);

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
