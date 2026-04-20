import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { UserAuthService } from '../../../services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss']
})
export class ConfirmEmailComponent extends BaseComponent implements OnInit {
  isConfirming: boolean = true;
  isSuccess: boolean = false;
  message: string = '';

  constructor(
    spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute,
    private userAuthService: UserAuthService,
    private router: Router,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallAtom);
    
    const userId = this.activatedRoute.snapshot.paramMap.get('userId');
    const token = this.activatedRoute.snapshot.paramMap.get('token');

    console.log('🔍 Email Confirmation - UserId:', userId);
    console.log('🔍 Email Confirmation - Token:', token);

    if (!userId || !token) {
      this.isConfirming = false;
      this.isSuccess = false;
      this.message = 'Geçersiz doğrulama linki.';
      this.hideSpinner(SpinnerType.BallAtom);
      return;
    }

    try {
      console.log('📤 Sending confirmation request...');
      const response = await this.userAuthService.confirmEmail(userId, token);
      console.log('📥 Confirmation response:', response);
      
      this.isConfirming = false;
      this.isSuccess = response.succeeded;
      this.message = response.message;

      if (response.succeeded) {
        this.toastrService.message(response.message, 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.toastrService.message(response.message, 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error: any) {
      console.error('❌ Error confirming email:', error);
      this.isConfirming = false;
      this.isSuccess = false;
      this.message = error?.error?.message || 'E-posta doğrulama sırasında bir hata oluştu.';
      
      this.toastrService.message(this.message, 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
