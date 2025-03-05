import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const ConsoleKitConfig = {
  baseUrl: process.env.CONSOLE_BASE_URL!,
  apiKey: process.env.CONSOLE_API_KEY!,
};

export const ServerConfig = {
  port: process.env.PORT || 3000,
};
