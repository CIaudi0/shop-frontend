import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Conferma Eliminazione</h2>
    <mat-dialog-content>
      Sei sicuro di voler eliminare definitivamente questo elemento?
      <br><br><strong>L'azione è irreversibile.</strong>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Sì, Elimina
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent { }