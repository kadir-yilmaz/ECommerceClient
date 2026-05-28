import { FacebookLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { async } from 'rxjs';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { TokenResponse } from '../../../contracts/token/tokenResponse';
import { AuthService } from '../../../services/common/auth.service';
import { HttpClientService } from '../../../services/common/http-client.service';
import { UserAuthService } from '../../../services/common/models/user-auth.service';
import { UserService } from '../../../services/common/models/user.service';
import { BasketService } from '../../../services/common/models/basket.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends BaseComponent implements OnInit {

  hidePassword = true;

  constructor(
    private userAuthService: UserAuthService, 
    spinner: NgxSpinnerService, 
    private authService: AuthService, 
    private activatedRoute: ActivatedRoute, 
    private router: Router, 
    public socialAuthService: SocialAuthService,
    private basketService: BasketService,
    private toastrService: CustomToastrService
  ) {
    super(spinner)
    socialAuthService.authState.subscribe(async (user: SocialUser) => {
      if (!user) return;
      this.showSpinner(SpinnerType.BallAtom);
      try {
        switch (user.provider) {
          case "GOOGLE":
            await userAuthService.googleLogin(user, () => {
              this.router.navigate([""]);
            });
            break;
          case "FACEBOOK":
            await userAuthService.facebookLogin(user, () => {
              this.router.navigate([""]);
            });
            break;
        }
      } catch (error) {
        console.error("Social login error:", error);
      } finally {
        this.hideSpinner(SpinnerType.BallAtom);
      }
    });
  }

  ngOnInit(): void {
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      this.toastrService.message('Email ve şifre alanları zorunludur', 'Eksik Bilgi', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.userAuthService.login(email, password, () => {
        // Use snapshot instead of subscribe for faster and synchronous redirect
        const returnUrl: string = this.activatedRoute.snapshot.queryParams["returnUrl"];
        if (returnUrl)
          this.router.navigate([returnUrl]);
        else
          this.router.navigate([""]);
      });
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Email veya şifre hatalı';
      } else if (error.status === 400) {
        errorMessage = 'Geçersiz giriş bilgileri';
      }
      
      this.toastrService.message(errorMessage, 'Giriş Başarısız', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  facebookLogin() {
    this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }
}
