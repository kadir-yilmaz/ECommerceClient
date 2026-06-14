import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/common/auth.service';
import { UserAuthService } from '../../../../services/common/models/user-auth.service';
import { BasketService } from '../../../../services/common/models/basket.service';
import { FavoriteService } from '../../../../services/common/models/favorite.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-account-sidebar',
  templateUrl: './account-sidebar.component.html',
  styleUrls: ['./account-sidebar.component.scss']
})
export class AccountSidebarComponent implements OnInit {
  @Input() activeTab: 'orders' | 'reviews' | 'addresses' | 'profile' | 'coupons' | '' = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private userAuthService: UserAuthService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private toastrService: CustomToastrService
  ) { }

  ngOnInit(): void {
  }

  async signOut(): Promise<void> {
    await this.userAuthService.logout();

    localStorage.removeItem('guest_basket_id');

    this.basketService.clear();
    this.favoriteService.clear();
    this.basketService.get();

    this.router.navigate(["/login"]);

    this.toastrService.message('Oturum kapatılmıştır.', 'Oturum Kapatıldı', {
      messageType: ToastrMessageType.Info,
      position: ToastrPosition.BottomRight
    });
  }
}
