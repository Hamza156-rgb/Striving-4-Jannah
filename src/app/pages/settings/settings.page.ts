import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonToggle, IonLabel
} from '@ionic/angular/standalone';
import { SettingsService, AppSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonToggle, IonLabel],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  settings!: AppSettings;
  methods: any[] = [];
  saved = false;

  languages = [
    { value: 'english', label: 'English', native: 'English' },
    { value: 'arabic', label: 'Arabic', native: 'العربية' },
    { value: 'urdu', label: 'Urdu', native: 'اردو' }
  ];

  constructor(
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.settings = { ...this.settingsService.get() };
    this.methods = this.settingsService.getCalculationMethods();
  }

  save() {
    this.settingsService.update(this.settings);
    // Defer toast so `saved` does not flip in the same CD turn as the click (avoids NG0100 in dev).
    setTimeout(() => {
      this.saved = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.saved = false;
        this.cdr.detectChanges();
      }, 2000);
    }, 0);
  }

  setLanguage(lang: string) {
    this.settings.language = lang as any;
    this.save();
  }

  setMethod(id: number) {
    this.settings.calculationMethod = id;
    this.save();
  }

  setAsrSchool(school: 0 | 1) {
    this.settings.asrSchool = school;
    this.save();
  }
}
