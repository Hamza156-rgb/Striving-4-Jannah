import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.striving4jannah.app',
  appName: 'Striving 4 Jannah',
  webDir: 'dist/noor-app/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0e1a'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0e1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#c9a84c'
    }
  }
};

export default config;
