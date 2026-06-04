import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/common/models/user.service';
import { List_User } from 'src/app/contracts/users/list_user';
import { DiscountCouponService } from 'src/app/services/common/models/discount-coupon.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-assign-coupon-dialog',
  templateUrl: './assign-coupon-dialog.component.html'
})
export class AssignCouponDialogComponent implements OnInit {
  
  users: List_User[] = [];
  assignForm: FormGroup;
  isSaving: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AssignCouponDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { couponId: string, couponCode: string },
    private userService: UserService,
    private formBuilder: FormBuilder,
    private discountCouponService: DiscountCouponService,
    private toastrService: CustomToastrService
  ) { 
    this.assignForm = this.formBuilder.group({
      userIds: [[], Validators.required]
    });
  }

  async ngOnInit() {
    try {
      const response = await this.userService.getAllUsers(0, 100);
      this.users = response.users;
    } catch (error) {
      this.toastrService.message("Kullanıcılar yüklenemedi.", "Hata", { messageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  async onAssign() {
    if (this.assignForm.invalid) return;

    this.isSaving = true;
    try {
      const userIds = this.assignForm.get('userIds')?.value;
      const response = await this.discountCouponService.assignCouponToUsers(this.data.couponId, userIds);
      if (response.success) {
        this.toastrService.message(response.message, "Başarılı", { messageType: ToastrMessageType.Success, position: ToastrPosition.TopRight });
        this.dialogRef.close(true);
      } else {
        this.toastrService.message(response.message, "Hata", { messageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    } catch (error) {
      this.toastrService.message("Kupon atama işlemi başarısız oldu.", "Hata", { messageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    } finally {
      this.isSaving = false;
    }
  }
}
