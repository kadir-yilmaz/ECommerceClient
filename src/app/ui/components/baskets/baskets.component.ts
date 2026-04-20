import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { filter, Subscription } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { List_Basket_Item } from '../../../contracts/basket/list_basket_item';
import { Update_Basket_Item } from '../../../contracts/basket/update_basket_item';
import { AuthService } from '../../../services/common/auth.service';
import { BasketItemDeleteState, BasketItemRemoveDialogComponent } from '../../../dialogs/basket-item-remove-dialog/basket-item-remove-dialog.component';
import { DialogService } from '../../../services/common/dialog.service';
import { BasketService } from '../../../services/common/models/basket.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-baskets',
  templateUrl: './baskets.component.html',
  styleUrls: ['./baskets.component.scss']
})
export class BasketsComponent extends BaseComponent implements OnInit, OnDestroy {

  constructor(
    spinner: NgxSpinnerService,
    private basketService: BasketService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dialogService: DialogService,
    public authService: AuthService
  ) {
    super(spinner)
  }

  basketItems: List_Basket_Item[] = [];
  private basketSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  get itemCount(): number {
    return this.basketItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice(): number {
    return this.basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  async ngOnInit(): Promise<void> {
    this.basketSubscription = this.basketService.basketItems$.subscribe(items => {
      this.basketItems = items;
    });
    
    // Listen to route changes and reload basket
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url === '/basket') {
          this.loadBasket();
        }
      });
    
    // Reactive auth state değişikliklerini dinle
    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.loadBasket();
    });
    
    await this.loadBasket();
  }

  ngOnDestroy(): void {
    this.basketSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  async loadBasket(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.basketService.get();
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async changeQuantity(basketItemId: string, quantityValue: string | number) {
    const quantity = Math.max(1, Number(quantityValue));
    const basketItem: Update_Basket_Item = new Update_Basket_Item();
    basketItem.basketItemId = basketItemId;
    basketItem.quantity = quantity;

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.basketService.updateQuantity(basketItem);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  removeBasketItem(basketItemId: string) {
    this.dialogService.openDialog({
      componentType: BasketItemRemoveDialogComponent,
      data: BasketItemDeleteState.Yes,
      afterClosed: async () => {
        this.showSpinner(SpinnerType.BallAtom);
        try {
          await this.basketService.remove(basketItemId);
          this.toastrService.message("Urun sepetten kaldirildi.", "Sepet Guncellendi", {
            messageType: ToastrMessageType.Info,
            position: ToastrPosition.BottomRight
          });
        } finally {
          this.hideSpinner(SpinnerType.BallAtom);
        }
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(["/products"]);
  }

  proceedToCheckout(): void {
    this.authService.identityCheck();

    if (!this.basketItems.length) {
      this.toastrService.message("Checkout icin once sepete urun eklemelisin.", "Sepet Bos", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    if (!this.authService.isAuthenticated) {
      this.toastrService.message("Checkout icin once giris yapman gerekiyor.", "Giris Gerekli", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(["/login"], { queryParams: { returnUrl: "/checkout" } });
      return;
    }

    this.router.navigate(["/checkout"]);
  }
}
