import { Component, inject, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../core/services/order'; 

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './orders.html'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private zone = inject(NgZone); 

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        console.log("Dati ricevuti da Rails:", data);
        this.zone.run(() => {
          this.orders.set(data);
          this.loading.set(false);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error("Errore nel caricamento ordini", err);
          this.loading.set(false);
        });
      }
    });
  }
}