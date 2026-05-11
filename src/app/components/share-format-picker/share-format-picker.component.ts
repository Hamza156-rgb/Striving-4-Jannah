import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonContent, IonIcon } from '@ionic/angular/standalone';

export type ShareFormatChoice = 'text' | 'image';

@Component({
  selector: 'app-share-format-picker',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './share-format-picker.component.html',
  styleUrls: ['./share-format-picker.component.scss']
})
export class ShareFormatPickerComponent {
  private readonly modalCtrl = inject(ModalController);

  /** Set via ModalController `componentProps`. */
  @Input() heading = 'Share';
  @Input() hint = 'Choose how you want to send this content.';

  pick(choice: ShareFormatChoice): void {
    void this.modalCtrl.dismiss({ choice });
  }

  dismissCancel(): void {
    void this.modalCtrl.dismiss(undefined, 'cancel');
  }
}
