import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProfileComponent } from './profile.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@NgModule({
  declarations: [
    ProfileComponent,
    ChangePasswordDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: '', component: ProfileComponent }
    ])
  ]
})
export class ProfileModule { }
