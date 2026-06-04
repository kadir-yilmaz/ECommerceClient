import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RewardCouponData {
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minCartAmount: number;
  validityDays: number;
}

@Component({
  selector: 'app-reward-coupon-dialog',
  templateUrl: './reward-coupon-dialog.component.html',
  styleUrls: ['./reward-coupon-dialog.component.scss']
})
export class RewardCouponDialogComponent {
  couponForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RewardCouponDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RewardCouponData
  ) {
    this.couponForm = this.fb.group({
      discountType: [data?.discountType || 'Amount', Validators.required],
      discountValue: [data?.discountValue || 0, [Validators.required, Validators.min(1)]],
      maxDiscountAmount: [data?.maxDiscountAmount || null, [Validators.min(0)]],
      minCartAmount: [data?.minCartAmount || 0, [Validators.min(0)]],
      validityDays: [data?.validityDays || 30, [Validators.required, Validators.min(1)]]
    });

    // Indirim tipine gore validasyon guncellemesi (Kargo Bedava ise indirim tutari zorunlu degil veya sifir olabilir vs)
    this.couponForm.get('discountType')?.valueChanges.subscribe(val => {
      if (val === 'FreeShipping') {
        this.couponForm.get('discountValue')?.setValue(0);
        this.couponForm.get('discountValue')?.disable();
        this.couponForm.get('maxDiscountAmount')?.disable();
      } else {
        this.couponForm.get('discountValue')?.enable();
        this.couponForm.get('maxDiscountAmount')?.enable();
      }
    });

    if (data?.discountType === 'FreeShipping') {
      this.couponForm.get('discountValue')?.disable();
      this.couponForm.get('maxDiscountAmount')?.disable();
    }
  }

  save() {
    if (this.couponForm.valid) {
      this.dialogRef.close(this.couponForm.getRawValue());
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
