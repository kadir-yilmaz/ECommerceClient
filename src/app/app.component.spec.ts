import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/common/auth.service';
import { BasketService } from './services/common/models/basket.service';
import { CustomToastrService } from './services/ui/custom-toastr.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserAuthService } from './services/common/models/user-auth.service';

describe('AppComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let basketServiceSpy: jasmine.SpyObj<BasketService>;
  let toastrServiceSpy: jasmine.SpyObj<CustomToastrService>;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['identityCheck', 'clearAuthentication'], {
      isAuthenticated$: of(false),
      userName$: of(null),
      userId$: of(null),
      roles$: of(null)
    });
    basketServiceSpy = jasmine.createSpyObj('BasketService', ['get', 'clear']);
    toastrServiceSpy = jasmine.createSpyObj('CustomToastrService', ['message']);
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['refreshTokenLogin', 'logout']);
    userAuthServiceSpy.logout.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: BasketService, useValue: basketServiceSpy },
        { provide: CustomToastrService, useValue: toastrServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        JwtHelperService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should call identityCheck and get basket on initialization', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(authServiceSpy.identityCheck).toHaveBeenCalled();
    expect(basketServiceSpy.get).toHaveBeenCalled();
  });

  describe('signOut', () => {
    it('should call userAuthService.logout()', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      await app.signOut();
      
      expect(userAuthServiceSpy.logout).toHaveBeenCalled();
    });

    it('should remove guest_basket_id from localStorage', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      spyOn(localStorage, 'removeItem');
      await app.signOut();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_basket_id');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('accessToken');
    });

    it('should clear basket state', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      await app.signOut();
      
      expect(basketServiceSpy.clear).toHaveBeenCalled();
    });

    it('should refresh basket for guest session', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      basketServiceSpy.get.calls.reset();
      await app.signOut();
      
      expect(basketServiceSpy.get).toHaveBeenCalled();
    });

    it('should show confirmation message', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      await app.signOut();
      
      expect(toastrServiceSpy.message).toHaveBeenCalled();
    });
  });
});
