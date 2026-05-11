import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { addIcons } from 'ionicons';
import {
  home,
  book,
  time,
  library,
  settings,
  searchOutline,
  closeCircle,
  closeOutline,
  chatbubblesOutline,
  imageOutline,
  shareOutline
} from 'ionicons/icons';

addIcons({
  'home': home,
  'book': book,
  'time': time,
  'library': library,
  'settings': settings,
  'search-outline': searchOutline,
  'close-circle': closeCircle,
  'close-outline': closeOutline,
  'chatbubbles-outline': chatbubblesOutline,
  'image-outline': imageOutline,
  'share-outline': shareOutline
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(IonicModule.forRoot({
      mode: 'ios',
      animated: true
    })),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ]
};
