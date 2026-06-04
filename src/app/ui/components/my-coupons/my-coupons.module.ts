import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyCouponsRoutingModule } from './my-coupons-routing.module';
import { MyCouponsComponent } from './my-coupons.component';


@NgModule({
  declarations: [
    MyCouponsComponent
  ],
  imports: [
    CommonModule,
    MyCouponsRoutingModule
  ]
})
export class MyCouponsModule { }
