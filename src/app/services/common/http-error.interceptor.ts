import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 veya 403 hatası ve admin panelindeyse
        if ((error.status === 401 || error.status === 403) && this.router.url.startsWith('/admin')) {
          // Login sayfası değilse ve access-denied sayfası değilse
          if (!this.router.url.includes('/login') && !this.router.url.includes('/access-denied')) {
            this.router.navigate(['/admin/access-denied']);
          }
        }
        
        return throwError(() => error);
      })
    );
  }
}
