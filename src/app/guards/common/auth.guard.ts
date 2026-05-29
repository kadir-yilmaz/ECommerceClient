import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt'
import { AuthTokenStore } from '../../services/common/auth-token-store';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from '../../base/base.component';
import { AuthService } from '../../services/common/auth.service';
import { UserAuthService } from '../../services/common/models/user-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private jwtHelper: JwtHelperService,
    private router: Router,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private userAuthService: UserAuthService
  ) {

  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    this.spinner.show(SpinnerType.BallAtom);

    const token: string | null = AuthTokenStore.accessToken;

    let expired: boolean;
    try {
      expired = this.jwtHelper.isTokenExpired(token);
    } catch {
      expired = true;
    }

    let isAuthenticated = token != null && !expired;

    if (!isAuthenticated) {
      try {
        await this.userAuthService.refreshTokenLogin();
        isAuthenticated = this.authService.isAuthenticated;
      } catch (error) {
        console.error("AuthGuard silent refresh failed:", error);
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      this.router.navigate(["login"], { queryParams: { returnUrl: state.url } });
      this.toastrService.message("Oturum açmanız gerekiyor!", "Yetkisiz Erişim!", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.spinner.hide(SpinnerType.BallAtom);
      return false;
    }

    // Admin panel için yönetim yetkisi kontrolü
    if (state.url.startsWith('/admin')) {
      const hasAdminAccess = this.authService.hasAdminAccess;
      if (!hasAdminAccess) {
        this.router.navigate([""]);
        this.toastrService.message("Bu sayfaya erişim yetkiniz yok!", "Yetkisiz Erişim!", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
        this.spinner.hide(SpinnerType.BallAtom);
        return false;
      }
    }

    this.spinner.hide(SpinnerType.BallAtom);
    return true;
  }

}
