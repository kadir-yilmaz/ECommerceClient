import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BasketInterceptorService implements HttpInterceptor {

  constructor(private jwtHelper: JwtHelperService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = localStorage.getItem('accessToken');
    const isAuthenticated = !!accessToken && !this.jwtHelper.isTokenExpired(accessToken);
    
    if (!isAuthenticated) {
      if (accessToken) {
        localStorage.removeItem('accessToken');
      }

      let basketId = localStorage.getItem('guest_basket_id');
      
      if (!basketId) {
        basketId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        localStorage.setItem('guest_basket_id', basketId);
      }

      const clonedRequest = req.clone({
        headers: req.headers.set('Basket-Id', basketId)
      });

      return next.handle(clonedRequest);
    }
    
    return next.handle(req);
  }
}
