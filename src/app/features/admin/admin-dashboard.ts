import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; 
import { MatIconModule } from '@angular/material/icon';   
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService, AdminUser } from '../../core/services/admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatSnackBarModule
  ],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  
  public users = toSignal(this.adminService.getUsers(), { initialValue: [] });

  public searchTerm = signal('');
  public roleFilter = signal('');

  public filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    const allUsers = this.users(); 

    return allUsers.filter(user => {
      const matchesTerm = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = !role || user.role === role;
      return matchesTerm && matchesRole;
    });
  });

  public displayedColumns: string[] = ['name', 'email', 'role'];

  onRoleChange(user: AdminUser, newRole: string) {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole; 
        this.snackBar.open(`Ruolo di ${user.name} aggiornato a ${newRole.toUpperCase()}`, 'Chiudi', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open("Errore nell'aggiornamento del ruolo", 'Chiudi', { duration: 3000 });
        window.location.reload(); 
      }
    });
  }
}