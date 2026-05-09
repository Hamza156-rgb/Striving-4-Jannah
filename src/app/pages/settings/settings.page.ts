import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { SettingsService, AppSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  settings!: AppSettings;
  methods: any[] = [];
  saved = false;

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

  setMethod(id: number) {
    this.settings.calculationMethod = id;
    this.save();
  }

  setAsrSchool(school: 0 | 1) {
    this.settings.asrSchool = school;
    this.save();
  }
}
