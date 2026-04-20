import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerComponent } from './customer.component';
import { RouterModule } from '@angular/router';



import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    CustomerComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: "", component: CustomerComponent }
    ])
  ]
})

export class CustomerModule { }
