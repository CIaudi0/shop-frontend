import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { OrderService } from '../../core/services/order';
import { HttpState } from '../../shared/http/http-state';
import { HttpStateCard } from '../../shared/http/http-state-card/http-state-card';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, DatePipe, CurrencyPipe, HttpStateCard],
  templateUrl: './orders.html'
})
export class OrdersComponent {
  private orderService = inject(OrderService);

  public state = signal<HttpState<any>>({ status: 'loading' });
  public orders = computed<any[]>(() => {
    const s = this.state();
    return s.status === 'success' ? s.data : [];
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set({ status: 'loading' });
    this.orderService.getOrders().subscribe({
      next: (data) => this.state.set({ status: 'success', data }),
      error: () => this.state.set({ status: 'error', message: 'Errore nel caricamento degli ordini.' })
    });
  }
}
