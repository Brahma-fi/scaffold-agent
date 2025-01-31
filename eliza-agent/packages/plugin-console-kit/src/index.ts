import { Plugin } from "@elizaos/core";
import { sendAction } from "./actions/send";
import { bridgeAction } from "./actions/bridge";
import { swapAction } from "./actions/swap";
import { bridgeStatusAction } from "./actions/status";
import { ConsoleKitService, ConsoleKitConfig } from "./services/console";

const service = new ConsoleKitService({} as ConsoleKitConfig);

export const consoleKitPlugin: Plugin = {
  name: "console-kit",
  description: "Provides blockchain operations through ConsoleKit",
  actions: [sendAction, bridgeAction, swapAction, bridgeStatusAction],
  evaluators: [],
  providers: [],
  services: [service],
};

export type { ConsoleKitConfig };
export default consoleKitPlugin;
