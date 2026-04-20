import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { AuthService } from '../../../../services/common/auth.service';
import { UserService } from '../../../../services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends BaseComponent implements OnInit {

  constructor(
    spinner: NgxSpinnerService,
    private authService: AuthService,
    private userService: UserService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  userName: string;
  email: string;

  ngOnInit(): void {
    this.authService.identityCheck();
    this.userName = this.authService.userName;
  }

  async changePassword(oldPassword: HTMLInputElement, newPassword: HTMLInputElement, newPasswordConfirm: HTMLInputElement) {
    this.showSpinner(SpinnerType.BallAtom);
    
    const userId = this.authService.userId;
    if (!userId) {
      this.toastrService.message("Kullanıcı bilgisi bulunamadı.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.hideSpinner(SpinnerType.BallAtom);
      return;
    }

    if (newPassword.value !== newPasswordConfirm.value) {
      this.toastrService.message("Şifreler uyuşmuyor.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.hideSpinner(SpinnerType.BallAtom);
      return;
    }

    await this.userService.changePassword(userId, oldPassword.value, newPassword.value, newPasswordConfirm.value, () => {
      this.toastrService.message("Şifreniz başarıyla değiştirilmiştir.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      oldPassword.value = "";
      newPassword.value = "";
      newPasswordConfirm.value = "";
    }, errorMessage => {
      this.toastrService.message(errorMessage, "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });

    this.hideSpinner(SpinnerType.BallAtom);
  }

}
