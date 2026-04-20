import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/common/auth.service';
import { BasketService } from './services/common/models/basket.service';
import { CustomToastrService } from './services/ui/custom-toastr.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let basketServiceSpy: jasmine.SpyObj<BasketService>;
  let toastrServiceSpy: jasmine.SpyObj<CustomToastrService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['identityCheck', 'clearAuthentication'], {
      isAuthenticated$: of(false),
      userName$: of(null),
      userId$: of(null),
      roles$: of(null)
    });
    basketServiceSpy = jasmine.createSpyObj('BasketService', ['get', 'clear']);
    toastrServiceSpy = jasmine.createSpyObj('CustomToastrService', ['message']);

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
    it('should remove tokens from localStorage', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      spyOn(localStorage, 'removeItem');
      app.signOut();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_basket_id');
    });

    it('should call clearAuthentication', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.signOut();
      
      expect(authServiceSpy.clearAuthentication).toHaveBeenCalled();
    });

    it('should clear basket state', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.signOut();
      
      expect(basketServiceSpy.clear).toHaveBeenCalled();
    });

    it('should refresh basket for guest session', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      basketServiceSpy.get.calls.reset();
      app.signOut();
      
      expect(basketServiceSpy.get).toHaveBeenCalled();
    });

    it('should show confirmation message', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      
      app.signOut();
      
      expect(toastrServiceSpy.message).toHaveBeenCalled();
    });
  });
});
