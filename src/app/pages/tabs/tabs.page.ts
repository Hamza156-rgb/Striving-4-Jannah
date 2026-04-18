import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="quran">
          <ion-icon name="book-outline"></ion-icon>
          <ion-label>Quran</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="prayer-times">
          <ion-icon name="time-outline"></ion-icon>
          <ion-label>Prayers</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="hadith">
          <ion-icon name="library-outline"></ion-icon>
          <ion-label>Hadith</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <ion-icon name="settings-outline"></ion-icon>
          <ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    ion-tab-bar {
      --background: #0d1626;
      border-top: 1px solid rgba(201,168,76,0.2);
      height: 75px;
      padding: 8px 0;
    }
    ion-tab-button {
      --color: #506480;
      --color-selected: #c9a84c;
      --padding-bottom: 8px;
      --padding-top: 8px;
      --padding-start: 0;
      --padding-end: 0;
    }
    ion-tab-button ion-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    ion-label { 
      font-size: 12px; 
      font-family: 'Lato', sans-serif; 
      font-weight: 500;
      letter-spacing: 0.3px;
    }
  `]
})
export class TabsPage {}
