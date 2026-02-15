import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.masarify.app',
  appName: 'Masarify',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
