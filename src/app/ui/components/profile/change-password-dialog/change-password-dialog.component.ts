import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { UserAuthService } from '../../../../services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent extends BaseComponent {
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    spinner: NgxSpinnerService,
    private userAuthService: UserAuthService,
    private toastrService: CustomToastrService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) {
    super(spinner);
  }

  async changePassword() {
    if (!this.passwordData.oldPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      this.toastrService.message('Lütfen tüm şifre alanlarını doldurun', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastrService.message('Yeni şifreler eşleşmiyor', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.toastrService.message('Yeni şifre en az 6 karakter olmalıdır', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const response = await this.userAuthService.changePassword(
        this.data.userId,
        this.passwordData.oldPassword,
        this.passwordData.newPassword,
        this.passwordData.confirmPassword
      );

      if (response.succeeded) {
        this.dialogRef.close(true);
      } else {
        this.toastrService.message(response.message, 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error?.error?.message || error?.error?.title || 'Şifre değiştirilirken hata oluştu';
      this.toastrService.message(errorMessage, 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
