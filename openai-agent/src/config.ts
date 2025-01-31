export const ConsoleKitConfig = {
  apiKey: process.env.CONSOLE_API_KEY || "",
  baseUrl: process.env.CONSOLE_BASE_URL || "https://api.console.fi"
};

export const OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  model: "gpt-4o-mini"
};
