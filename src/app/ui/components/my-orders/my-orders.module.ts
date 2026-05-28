import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyOrdersComponent } from './my-orders.component';
import { RouterModule } from '@angular/router';
import { SharedUiModule } from '../shared/shared-ui.module';

@NgModule({
  declarations: [
    MyOrdersComponent
  ],
  imports: [
    CommonModule,
    SharedUiModule,
    RouterModule.forChild([
      { path: "", component: MyOrdersComponent }
    ])
  ]
})
export class MyOrdersModule { }
