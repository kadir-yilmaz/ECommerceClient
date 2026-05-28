import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, map, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt'
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from '../../base/base.component';
import { AuthService } from '../../services/common/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private jwtHelper: JwtHelperService, private router: Router, private toastrService: CustomToastrService, private spinner: NgxSpinnerService, private authService: AuthService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.spinner.show(SpinnerType.BallAtom);

    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
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
      }),
      catchError(error => {
        console.error("AuthGuard error:", error);
        this.router.navigate(["login"], { queryParams: { returnUrl: state.url } });
        this.spinner.hide(SpinnerType.BallAtom);
        return of(false);
      })
    );
  }

}
