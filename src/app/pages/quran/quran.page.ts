import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-quran',
  standalone: true,
  imports: [CommonModule, RouterModule, IonContent, IonHeader, IonToolbar, IonTitle],
  templateUrl: './quran.page.html',
  styleUrls: ['./quran.page.scss']
})
export class QuranPage {}
