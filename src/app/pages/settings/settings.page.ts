import { Component, OnInit } from '@angular/core';
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

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this.settings = { ...this.settingsService.get() };
    this.methods = this.settingsService.getCalculationMethods();
  }

  save() {
    this.settingsService.update(this.settings);
    this.saved = true;
    setTimeout(() => this.saved = false, 2000);
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
