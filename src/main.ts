import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Android WebView often mirrors document.title into the native window caption (black bar).
if (Capacitor.isNativePlatform()) {
  document.title = '';
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
