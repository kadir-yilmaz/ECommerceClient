import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyOrdersComponent } from './my-orders.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    MyOrdersComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", component: MyOrdersComponent }
    ])
  ]
})
export class MyOrdersModule { }
