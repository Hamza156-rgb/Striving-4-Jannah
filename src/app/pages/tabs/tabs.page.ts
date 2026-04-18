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
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="quran">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <ion-label>Quran</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="prayer-times">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <ion-label>Prayers</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="hadith">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <line x1="8" y1="8" x2="16" y2="8"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
            <line x1="8" y1="16" x2="12" y2="16"></line>
          </svg>
          <ion-label>Hadith</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    ion-tab-bar {
      --background: linear-gradient(180deg, #0d1626 0%, #0a0e1a 100%);
      border-top: 1px solid rgba(201,168,76,0.25);
      height: 65px;
      padding: 8px 12px 12px;
      backdrop-filter: blur(20px);
      box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
      width: 100%;
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    ion-tab-button {
      --color: #6b7c93;
      --color-selected: #c9a84c;
      padding: 6px 4px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      flex: 1 !important;
      min-width: 0 !important;
      max-width: 20% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }
    ion-tab-button::part(native) {
      padding: 6px 8px;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      gap: 2px;
    }
    ion-tab-button.tab-selected::part(native) {
      background: rgba(201,168,76,0.08);
      border-radius: 12px;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(201,168,76,0.15);
    }
    .tab-icon {
      width: 20px;
      height: 20px;
      margin-bottom: 2px;
      transition: all 0.3s ease;
      display: block;
      text-align: center;
      color: #6b7c93;
    }
    ion-tab-button.tab-selected .tab-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 2px 4px rgba(201,168,76,0.3));
      color: #c9a84c;
    }
    ion-label { 
      font-size: 10px; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      font-weight: 500;
      letter-spacing: 0.2px;
      transition: all 0.3s ease;
      line-height: 1.1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }
    ion-tab-button.tab-selected ion-label {
      font-weight: 600;
      color: #e8c97a;
      font-size: 11px;
    }
    ion-tab-button:not(.tab-selected):hover {
      --color: #9aafcc;
    }
    ion-tab-button:not(.tab-selected):active {
      transform: scale(0.95);
    }
  `]
})
export class TabsPage {}
