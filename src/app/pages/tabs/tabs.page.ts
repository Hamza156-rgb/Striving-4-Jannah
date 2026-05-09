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
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
          </svg>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="quran">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.41.21.75-.19.75-.45V6c-1.49-1.12-3.63-1.5-4.5-1.5zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
          <ion-label>Quran</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="prayer-times">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          <ion-label>Prayers</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="hadith">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
          </svg>
          <ion-label>Hadith</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
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
      min-height: 70px;
      height: auto;
      padding: 0;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      backdrop-filter: blur(20px);
      box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
      width: 100%;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
    }
    ion-tab-button {
      --color: #6b7c93;
      --color-selected: #c9a84c;
      padding: 8px 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      flex: 1 1 auto !important;
      min-width: 0 !important;
      max-width: none !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      height: 100%;
    }
    ion-tab-button::part(native) {
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      gap: 4px;
    }
    ion-tab-button.tab-selected::part(native) {
      background: rgba(201,168,76,0.08);
      border-radius: 12px;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(201,168,76,0.15);
    }
    .tab-icon {
      width: 24px;
      height: 24px;
      margin: 0 auto 2px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
      text-align: center;
      color: #6b7c93;
      opacity: 0.8;
    }
    ion-tab-button.tab-selected .tab-icon {
      transform: scale(1.15);
      filter: drop-shadow(0 2px 8px rgba(201,168,76,0.4));
      color: #c9a84c;
      opacity: 1;
    }
    ion-tab-button:hover .tab-icon {
      color: #9aafcc;
      opacity: 0.9;
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
