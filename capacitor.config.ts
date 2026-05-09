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
      style: 'DARK',
      backgroundColor: '#0a0e1a',
      // Default is true; that lays out under the status bar and clashes with
      // fitsSystemWindows / non-overlay window sizing — often shows as a black strip above the WebView on Android.
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#28C76F'
    }
  }
};

export default config;
