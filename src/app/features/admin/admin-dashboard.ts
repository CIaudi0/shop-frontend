import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; // <-- AGGIUNTO
import { MatIconModule } from '@angular/material/icon';   // <-- AGGIUNTO
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUser } from '../../core/services/admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule, // <-- AGGIUNTO
    MatIconModule,  // <-- AGGIUNTO
    MatSnackBarModule
  ],
  template: `
    <div style="padding: 20px; max-width: 1200px; margin: auto;">
      <h2>Dashboard Amministratore</h2>

      <form class="filters" (submit)="$event.preventDefault()" style="display: flex; gap: 16px; margin-bottom: 20px;">
        
        <mat-form-field appearance="outline" style="flex: 2;">
          <mat-label>Cerca per nome o email</mat-label>
          <input
            matInput
            type="search"
            name="searchTerm"
            placeholder="Es. Mario, Rossi, test@gmail.com..."
            [(ngModel)]="filters.searchTerm"
            (ngModelChange)="applyFilters()"
          />
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" style="flex: 1;">
          <mat-label>Filtra per Ruolo</mat-label>
          <mat-select [(ngModel)]="filters.ruolo" name="ruolo" (ngModelChange)="applyFilters()">
            <mat-option value="">Tutti i ruoli</mat-option>
            <mat-option value="user">User</mat-option>
            <mat-option value="vendor">Vendor</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>

      </form>

      <table mat-table [dataSource]="filteredUsers" class="mat-elevation-z8" style="width: 100%;">
        
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Nome </th>
          <td mat-cell *matCellDef="let user"> {{user.name}} </td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef> Email </th>
          <td mat-cell *matCellDef="let user"> {{user.email}} </td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef> Ruolo </th>
          <td mat-cell *matCellDef="let user">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 130px; margin: 8px 0;">
              <mat-select [value]="user.role" (selectionChange)="onRoleChange(user, $event.value)">
                <mat-option value="user">USER</mat-option>
                <mat-option value="vendor">VENDOR</mat-option>
                <mat-option value="admin">ADMIN</mat-option>
              </mat-select>
            </mat-form-field>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" colspan="3" style="text-align: center; padding: 2rem;">
            Nessun utente trovato con questi filtri.
          </td>
        </tr>
      </table>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  
  // Modificato per indicare che cerca ovunque
  protected filters = { searchTerm: '', ruolo: '' };
  
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = []; // Questo è l'array che userà la tabella
  displayedColumns: string[] = ['name', 'email', 'role'];

  ngOnInit() {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users]; // Riempiamo la tabella all'inizio!
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onRoleChange(user: AdminUser, newRole: string) {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.snackBar.open(`Ruolo di ${user.name} aggiornato a ${newRole.toUpperCase()}`, 'Chiudi', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        
        // Riapplica i filtri (utile se avevi filtrato per ruolo "User" e lo fai diventare "Admin", così sparisce dalla vista corrente)
        this.applyFilters();
      },
      error: (err) => {
        console.error("Errore durante l'aggiornamento", err);
        this.snackBar.open("Errore nell'aggiornamento del ruolo", 'Chiudi', { duration: 3000 });
        this.ngOnInit();
      }
    });
  }

  applyFilters(): void {
    const term = this.filters.searchTerm.trim().toLowerCase();
    const ruolo = this.filters.ruolo;

    this.filteredUsers = this.users.filter((user) => {
      // Cerca sia nel nome che nell'email in un colpo solo
      const matchesTerm = !term || 
                          user.name.toLowerCase().includes(term) || 
                          user.email.toLowerCase().includes(term);
      
      const matchesRuolo = !ruolo || user.role === ruolo;
      
      return matchesTerm && matchesRuolo;
    });
  }
}