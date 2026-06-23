import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.adabibnak.app",
  appName: "أدابيبنك",
  webDir: "out",
  server: {
    url: "https://adabibnak-n24c.vercel.app//splash", // ← رابط Vercel + /splash
    cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // نتحكم فيه بأنفسنا من كود
      backgroundColor: "#2563eb",
      showSpinner: false,
    },
  },
};

export default config;