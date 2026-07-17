import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chessdeeper.app",
  appName: "ChessDeeper",
  webDir: "public",
  server: {
    url: "https://chessdeeper.com",
    cleartext: false,
  },
};

export default config;