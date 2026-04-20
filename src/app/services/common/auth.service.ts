import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private jwtHelper: JwtHelperService) { }

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  private _userName = new BehaviorSubject<string | null>(null);
  public userName$ = this._userName.asObservable();

  private _userId = new BehaviorSubject<string | null>(null);
  public userId$ = this._userId.asObservable();

  private _roles = new BehaviorSubject<string[] | null>(null);
  public roles$ = this._roles.asObservable();

  identityCheck() {
    const token: string = localStorage.getItem("accessToken");

    let expired: boolean;
    try {
      expired = this.jwtHelper.isTokenExpired(token);
    } catch {
      expired = true;
    }

    const isAuthenticated = token != null && !expired;
    if (isAuthenticated) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const userName = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decodedToken["name"];
      let roles = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decodedToken["roles"];
      const userId = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      
      if (roles && !Array.isArray(roles)) {
        roles = [roles];
      }

      this._userName.next(userName);
      this._roles.next(roles);
      this._userId.next(userId);
    } else {
      this._userName.next(null);
      this._roles.next(null);
      this._userId.next(null);
    }

    this._isAuthenticated.next(isAuthenticated);
  }

  /**
   * Updates authentication state by reading and validating token from localStorage.
   * Should be called after login operations complete.
   */
  setAuthenticated(): void {
    this.identityCheck();
  }

  /**
   * Clears all authentication state without reading localStorage.
   * Should be called during logout operations.
   */
  clearAuthentication(): void {
    this._userName.next(null);
    this._userId.next(null);
    this._roles.next(null);
    this._isAuthenticated.next(false);
  }

  /**
   * @deprecated Use isAuthenticated$ observable instead
   */
  get isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }

  /**
   * @deprecated Use userName$ observable instead
   */
  get userName(): string | null {
    return this._userName.value;
  }

  /**
   * @deprecated Use userId$ observable instead
   */
  get userId(): string | null {
    return this._userId.value;
  }

  /**
   * @deprecated Use roles$ observable instead
   */
  get roles(): string[] | null {
    return this._roles.value;
  }

  /**
   * @deprecated Use roles$ observable with pipe(map(roles => roles?.includes('Admin') ?? false))
   */
  get isAdmin(): boolean {
    return this._roles.value?.includes("Admin") ?? false;
  }

  /**
   * Checks if user has any role (for admin panel access)
   */
  get hasAnyRole(): boolean {
    return this._roles.value != null && this._roles.value.length > 0;
  }

  /**
   * Observable that emits true if user has any role
   */
  get hasAnyRole$() {
    return this.roles$.pipe(
      map(roles => roles != null && roles.length > 0)
    );
  }
}
