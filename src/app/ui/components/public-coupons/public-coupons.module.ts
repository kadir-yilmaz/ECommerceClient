import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PublicCouponsComponent } from './public-coupons.component';

@NgModule({
  declarations: [
    PublicCouponsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      { path: '', component: PublicCouponsComponent }
    ])
  ]
})
export class PublicCouponsModule { }
