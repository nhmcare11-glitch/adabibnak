import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adabibnak.app',
  appName: 'adabibnak',
    webDir: 'out',
  server: {
    url: 'https://adabibnak-n24c.vercel.app',
    cleartext: true
  }
};

export default config;

