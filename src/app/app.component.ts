import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/common/auth.service';
import { BasketService } from './services/common/models/basket.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from './services/ui/custom-toastr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAdminPage: boolean = false;
  isAuthPage: boolean = false;
  private authSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    public router: Router,
    public basketService: BasketService
  ) {
    authService.identityCheck();
    basketService.get();

    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isAdminPage = event.urlAfterRedirects.startsWith('/admin');
        this.isAuthPage = event.urlAfterRedirects.startsWith('/login') || event.urlAfterRedirects.startsWith('/register');
      }
    });
  }

  ngOnInit(): void {
    // Reactive auth state değişikliklerini dinle
    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.basketService.get();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  signOut() {
    // Step 1: Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('guest_basket_id');
    
    // Step 2: Clear authentication state
    this.authService.clearAuthentication();
    
    // Step 3: Clear basket state
    this.basketService.clear();
    
    // Step 4: Refresh basket for guest session
    this.basketService.get();
    
    // Step 5: Navigate to home
    this.router.navigate(['']);
    
    // Step 6: Show confirmation
    this.toastrService.message('Oturum kapatilmistir.', 'Oturum Kapatildi', {
      messageType: ToastrMessageType.Info,
      position: ToastrPosition.BottomRight
    });
  }
}
