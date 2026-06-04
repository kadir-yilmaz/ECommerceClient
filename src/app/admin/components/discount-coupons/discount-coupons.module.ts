import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { DiscountCouponsRoutingModule } from './discount-coupons-routing.module';
import { DiscountCouponsComponent } from './discount-coupons.component';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssignCouponDialogComponent } from './assign-coupon-dialog/assign-coupon-dialog.component';
import { CouponUsersDialogComponent } from './coupon-users-dialog/coupon-users-dialog.component';

@NgModule({
  declarations: [
    DiscountCouponsComponent,
    AssignCouponDialogComponent,
    CouponUsersDialogComponent
  ],
  imports: [
    CommonModule,
    DiscountCouponsRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatTooltipModule
  ]
})
export class DiscountCouponsModule { }
