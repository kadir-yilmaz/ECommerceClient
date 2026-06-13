import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyCouponsRoutingModule } from './my-coupons-routing.module';
import { MyCouponsComponent } from './my-coupons.component';
import { SharedUiModule } from '../shared/shared-ui.module';


@NgModule({
  declarations: [
    MyCouponsComponent
  ],
  imports: [
    CommonModule,
    MyCouponsRoutingModule,
    SharedUiModule
  ]
})
export class MyCouponsModule { }
