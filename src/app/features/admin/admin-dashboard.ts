import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUser } from '../../core/services/admin';
import { HttpState } from '../../shared/http/http-state';
import { HttpStateCard } from '../../shared/http/http-state-card/http-state-card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatSnackBarModule,
    HttpStateCard
  ],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  public state = signal<HttpState<AdminUser>>({ status: 'loading' });
  public searchTerm = signal('');
  public roleFilter = signal('');

  private allUsers = computed<AdminUser[]>(() => {
    const s = this.state();
    return s.status === 'success' ? s.data : [];
  });

  public filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    return this.allUsers().filter(user => {
      const matchesTerm = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = !role || user.role === role;
      return matchesTerm && matchesRole;
    });
  });

  public displayedColumns: string[] = ['name', 'email', 'role'];

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set({ status: 'loading' });
    this.adminService.getUsers().subscribe({
      next: (data) => this.state.set({ status: 'success', data }),
      error: () => this.state.set({ status: 'error', message: 'Errore nel caricamento degli utenti.' })
    });
  }

  onRoleChange(user: AdminUser, newRole: string) {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.snackBar.open(`Ruolo di ${user.name} aggiornato a ${newRole.toUpperCase()}`, 'Chiudi', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open("Errore nell'aggiornamento del ruolo", 'Chiudi', { duration: 3000 });
        this.load();
      }
    });
  }
}
