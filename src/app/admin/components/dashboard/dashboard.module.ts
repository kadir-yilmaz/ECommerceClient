import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { RouterModule } from '@angular/router';



import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: "", component: DashboardComponent }
    ])
  ]
})

export class DashboardModule { }
