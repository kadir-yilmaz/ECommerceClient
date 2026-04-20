import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { UserAuthService } from '../../../services/common/models/user-auth.service';
import { AuthService } from '../../../services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends BaseComponent implements OnInit {
  userProfile: any = {
    userName: '',
    email: '',
    nameSurname: '',
    emailConfirmed: false
  };

  emailVerificationCode: string = '';
  showCodeInput: boolean = false;

  constructor(
    spinner: NgxSpinnerService,
    private userAuthService: UserAuthService,
    private authService: AuthService,
    private toastrService: CustomToastrService,
    private dialog: MatDialog
  ) {
    super(spinner);
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.userProfile = await this.userAuthService.getUserProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
      this.toastrService.message('Profil yüklenirken hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async updateProfile() {
    if (!this.userProfile.userName || !this.userProfile.email || !this.userProfile.nameSurname) {
      this.toastrService.message('Lütfen tüm alanları doldurun', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const response = await this.userAuthService.updateUserProfile(
        this.userProfile.userName,
        this.userProfile.email,
        this.userProfile.nameSurname
      );

      if (response.succeeded) {
        this.toastrService.message(response.message, 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
        
        // Token'ı yenile
        this.authService.identityCheck();
        await this.loadProfile();
      } else {
        this.toastrService.message(response.message, 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.toastrService.message(error?.error?.message || 'Profil güncellenirken hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async sendEmailConfirmation() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const response = await this.userAuthService.sendEmailConfirmation();
      
      if (response.succeeded) {
        this.showCodeInput = true;
        this.toastrService.message(response.message, 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      } else {
        this.toastrService.message(response.message, 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error) {
      console.error('Error sending email confirmation:', error);
      this.toastrService.message('E-posta doğrulama gönderilirken hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async verifyEmailCode() {
    if (!this.emailVerificationCode || this.emailVerificationCode.length !== 6) {
      this.toastrService.message('Lütfen 6 haneli doğrulama kodunu girin', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const response = await this.userAuthService.confirmEmail(this.userProfile.id, this.emailVerificationCode);
      
      if (response.succeeded) {
        this.toastrService.message(response.message, 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
        
        this.showCodeInput = false;
        this.emailVerificationCode = '';
        await this.loadProfile();
      } else {
        this.toastrService.message(response.message, 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      this.toastrService.message(error?.error?.message || 'Kod doğrulama sırasında hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      data: { userId: this.userProfile.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.toastrService.message('Şifreniz başarıyla değiştirildi', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      }
    });
  }
}
