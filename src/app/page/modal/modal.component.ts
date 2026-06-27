import { NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [NgClass,NgIf],
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() isVisible: boolean = false;
  @Input() modalType: 'success' | 'error' | 'confirm' = 'confirm';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() icon: string = 'ri-checkbox-circle-line'; // Icône par défaut
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.isVisible = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isVisible = false;
  }
}
