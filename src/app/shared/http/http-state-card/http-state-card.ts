import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { HttpState } from '../http-state';

@Component({
  selector: 'app-http-state-card',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatCardModule],
  templateUrl: './http-state-card.html',
})
export class HttpStateCard {
  @Input() state: HttpState<unknown> | null = null;
  @Output() retry = new EventEmitter<void>();
  onRetry(): void {
    this.retry.emit();
  }
}



