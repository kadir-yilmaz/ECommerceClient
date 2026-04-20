import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AccessDeniedComponent } from './access-denied.component';

@NgModule({
  declarations: [AccessDeniedComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: '', component: AccessDeniedComponent }
    ])
  ]
})
export class AccessDeniedModule { }
