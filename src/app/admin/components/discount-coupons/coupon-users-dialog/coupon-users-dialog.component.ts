import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CouponUserDto } from 'src/app/contracts/discount-coupon/discount-coupon';

@Component({
  selector: 'app-coupon-users-dialog',
  templateUrl: './coupon-users-dialog.component.html',
  styleUrls: ['./coupon-users-dialog.component.scss']
})
export class CouponUsersDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<CouponUsersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { couponCode: string, users: CouponUserDto[] }
  ) { }

  close(): void {
    this.dialogRef.close();
  }
}
