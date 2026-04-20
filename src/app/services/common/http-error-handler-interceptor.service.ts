import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { SpinnerType } from '../../base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { UserAuthService } from './models/user-auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerInterceptorService implements HttpInterceptor {

  constructor(
    private toastrService: CustomToastrService,
    private userAuthService: UserAuthService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(catchError((error): Observable<HttpEvent<any>> => {
      this.spinner.hide(SpinnerType.BallAtom);

      // Status 0 → network/CORS/SSL errors: silently log but ensure spinner is hidden
      if (error.status === 0) {
        console.error("Network or CORS error occurred:", error);
        return throwError(() => error);
      }

      switch (error.status) {
        case HttpStatusCode.Unauthorized:
          const refreshToken = localStorage.getItem("refreshToken");
          const isLoginPage = this.router.url.includes("/login");

          if (refreshToken && !isLoginPage) {
            // Arka planda token yenile ve isteği tekrarla
            return this.userAuthService.refreshTokenLoginObservable(refreshToken).pipe(
              switchMap((response: any) => {
                if (response && response.token) {
                  localStorage.setItem("accessToken", response.token.accessToken);
                  localStorage.setItem("refreshToken", response.token.refreshToken);
                  this.userAuthService.setAuthenticated();
                  
                  // Orijinal isteği yeni token ile tekrar gönder
                  const clonedRequest = req.clone({
                    setHeaders: { Authorization: `Bearer ${response.token.accessToken}` }
                  });
                  return next.handle(clonedRequest);
                }
                this._handleUnauthorized();
                return throwError(() => error);
              }),
              catchError(err => {
                this._handleUnauthorized();
                return throwError(() => err);
              })
            );
          } else {
            if (!isLoginPage) {
              this._handleUnauthorized();
            }
            return throwError(() => error);
          }

        case HttpStatusCode.InternalServerError:
          this.toastrService.message("Sunucuya erişilmiyor!", "Sunucu hatası!", {
            messageType: ToastrMessageType.Error,
            position: ToastrPosition.BottomRight
          });
          break;

        case HttpStatusCode.BadRequest:
          // Don't show generic toast for BadRequest — let the component handle
          // specific validation errors with its own error callback
          break;

        case HttpStatusCode.NotFound:
          // Only show for page navigation, not API calls
          break;

        case HttpStatusCode.Forbidden:
          this.toastrService.message("Bu işlemi yapmaya yetkiniz bulunmamaktadır!", "Yetkisiz işlem!", {
            messageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomRight
          });
          break;

        default:
          // Don't show generic toast — let components handle specific errors
          break;
      }

      return throwError(() => error);
    }));
  }

  private _handleUnauthorized() {
    const url = this.router.url;

    // Don't show toast for expected unauthenticated requests (baskets, products list etc.)
    if (url === "/products" || url === "/" || url.startsWith("/products/")) {
      // Silently redirect or ignore — user is just browsing
    } else if (url.startsWith("/admin")) {
      this.toastrService.message("Bu sayfaya erişim yetkiniz yok!", "Yetkisiz Erişim!", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(["/"]);
    } else {
      this.toastrService.message("Oturum açmanız gerekiyor.", "Oturum Gerekli", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(["login"], { queryParams: { returnUrl: url } });
    }
  }
}
