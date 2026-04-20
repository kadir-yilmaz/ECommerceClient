import { SocialUser } from '@abacritt/angularx-social-login';
import { Injectable } from '@angular/core';

import { firstValueFrom, Observable } from 'rxjs';
import { TokenResponse } from '../../../contracts/token/tokenResponse';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';
import { HttpClientService } from '../http-client.service';
import { AuthService } from '../auth.service';
import { BasketService } from './basket.service';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  constructor(private httpClientService: HttpClientService, private toastrService: CustomToastrService, private basketService: BasketService, private authService: AuthService) { }

  async login(email: string, password: string, callBackFunction?: () => void): Promise<any> {
    const observable: Observable<any | TokenResponse> = this.httpClientService.post<any | TokenResponse>({
      controller: "auth",
      action: "login"
    }, { userNameOrEmail: email, password })

    const tokenResponse: TokenResponse = await firstValueFrom(observable) as TokenResponse;

    if (tokenResponse) {
      localStorage.setItem("accessToken", tokenResponse.token.accessToken);
      localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);

      // Merge guest basket with user basket
      const guestBasketId = localStorage.getItem("guest_basket_id");
      if (guestBasketId) {
        try {
          await firstValueFrom(this.httpClientService.post({ 
            controller: "baskets", 
            action: "merge"
          }, { guestBasketId }));
          localStorage.removeItem("guest_basket_id");
          
          // Refresh basket to show merged items
          await this.basketService.get();
        } catch (err) { 
          console.error("Basket merge error:", err); 
        }
      }

      // Update auth state before callback
      this.authService.setAuthenticated();

      this.toastrService.message("Kullanıcı girişi başarıyla sağlanmıştır.", "Giriş Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      })
    }

    callBackFunction?.();
  }

  async refreshTokenLogin(refreshToken: string, callBackFunction?: (state) => void): Promise<any> {
    const observable: Observable<any | TokenResponse> = this.refreshTokenLoginObservable(refreshToken);

    try {
      const tokenResponse: TokenResponse = await firstValueFrom(observable) as TokenResponse;

      if (tokenResponse) {
        localStorage.setItem("accessToken", tokenResponse.token.accessToken);
        localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);
        this.authService.setAuthenticated();
      }

      callBackFunction?.(tokenResponse ? true : false);
    } catch {
      callBackFunction?.(false);
    }
  }

  refreshTokenLoginObservable(refreshToken: string): Observable<any> {
    return this.httpClientService.post({
      action: "refreshtokenlogin",
      controller: "auth"
    }, { refreshToken: refreshToken });
  }

  setAuthenticated() {
    this.authService.setAuthenticated();
  }

  async googleLogin(user: SocialUser, callBackFunction?: () => void): Promise<any> {
    const observable: Observable<SocialUser | TokenResponse> = this.httpClientService.post<SocialUser | TokenResponse>({
      action: "google-login",
      controller: "auth"
    }, user);

    const tokenResponse: TokenResponse = await firstValueFrom(observable) as TokenResponse;

    if (tokenResponse) {
      localStorage.setItem("accessToken", tokenResponse.token.accessToken);
      localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);

      // Merge guest basket with user basket
      const guestBasketId = localStorage.getItem("guest_basket_id");
      if (guestBasketId) {
        try {
          await firstValueFrom(this.httpClientService.post({ 
            controller: "baskets", 
            action: "merge"
          }, { guestBasketId }));
          localStorage.removeItem("guest_basket_id");
          
          // Refresh basket to show merged items
          await this.basketService.get();
        } catch (err) { 
          console.error("Basket merge error:", err); 
        }
      }

      // Update auth state before callback
      this.authService.setAuthenticated();

      this.toastrService.message("Google üzerinden giriş başarıyla sağlanmıştır.", "Giriş Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    }

    callBackFunction?.();
  }

  async facebookLogin(user: SocialUser, callBackFunction?: () => void): Promise<any> {
    const observable: Observable<SocialUser | TokenResponse> = this.httpClientService.post<SocialUser | TokenResponse>({
      controller: "auth",
      action: "facebook-login"
    }, user);

    const tokenResponse: TokenResponse = await firstValueFrom(observable) as TokenResponse;

    if (tokenResponse) {
      localStorage.setItem("accessToken", tokenResponse.token.accessToken);
      localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);

      // Merge guest basket with user basket
      const guestBasketId = localStorage.getItem("guest_basket_id");
      if (guestBasketId) {
        try {
          await firstValueFrom(this.httpClientService.post({ 
            controller: "baskets", 
            action: "merge"
          }, { guestBasketId }));
          localStorage.removeItem("guest_basket_id");
          
          // Refresh basket to show merged items
          await this.basketService.get();
        } catch (err) { 
          console.error("Basket merge error:", err); 
        }
      }

      // Update auth state before callback
      this.authService.setAuthenticated();

      this.toastrService.message("Facebook üzerinden giriş başarıyla sağlanmıştır.", "Giriş Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      })
    }

    callBackFunction?.();
  }

  async passwordReset(email: string, callBackFunction?: () => void) {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "auth",
      action: "password-reset"
    }, { email: email });

    await firstValueFrom(observable);
    callBackFunction?.();
  }

  async verifyResetToken(resetToken: string, userId: string, callBackFunction?: () => void): Promise<boolean> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "auth",
      action: "verify-reset-token"
    }, {
      resetToken: resetToken,
      userId: userId
    });

    const state: boolean = await firstValueFrom(observable);
    callBackFunction?.();
    return state;
  }

  async getAuthorizedMenus(): Promise<string[]> {
    const observable: Observable<{ menus: string[] }> = this.httpClientService.get({
      controller: "users",
      action: "authorized-menus"
    });

    const response = await firstValueFrom(observable);
    return response.menus;
  }

  async getUserProfile(): Promise<any> {
    const observable: Observable<any> = this.httpClientService.get({
      controller: "users",
      action: "profile"
    });

    return await firstValueFrom(observable);
  }

  async updateUserProfile(userName: string, email: string, nameSurname: string): Promise<any> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: "users",
      action: "profile"
    }, { userName, email, nameSurname });

    return await firstValueFrom(observable);
  }

  async sendEmailConfirmation(): Promise<any> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "users",
      action: "send-email-confirmation"
    }, {});

    return await firstValueFrom(observable);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<any> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "users",
      action: "change-password"
    }, { userId, oldPassword, newPassword, newPasswordConfirm });

    return await firstValueFrom(observable);
  }

  async confirmEmail(userId: string, code: string): Promise<any> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "users",
      action: "confirm-email"
    }, { userId, code });

    return await firstValueFrom(observable);
  }
}
