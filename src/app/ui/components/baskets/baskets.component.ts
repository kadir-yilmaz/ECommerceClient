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
import { CalculateDiscountRequest, CalculateDiscountItem } from '../../../contracts/discount/calculate_discount_request';
import { CalculateDiscountResponse } from '../../../contracts/discount/calculate_discount_response';

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
  discountResponse: CalculateDiscountResponse | null = null;
  couponCodeInput: string = '';
  private basketSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  get itemCount(): number {
    return this.basketItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice(): number {
    return this.discountResponse ? this.discountResponse.originalTotal : this.basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shippingFee(): number {
    if (this.discountResponse) return this.discountResponse.isShippingFree ? 0 : 59.99;
    return this.totalPrice >= 500 ? 0 : 59.99;
  }

  get grandTotal(): number {
    return this.discountResponse ? this.discountResponse.finalTotal + this.shippingFee : this.totalPrice + this.shippingFee;
  }

  get hasCouponApplied(): boolean {
    return !!this.discountResponse?.appliedDiscounts?.find(d => d.discountType === 'Coupon');
  }

  async incrementQuantity(basketItem: List_Basket_Item) {
    await this.changeQuantity(basketItem.basketItemId, basketItem.quantity + 1);
  }

  async decrementQuantity(basketItem: List_Basket_Item) {
    if (basketItem.quantity > 1) {
      await this.changeQuantity(basketItem.basketItemId, basketItem.quantity - 1);
    }
  }

  async ngOnInit(): Promise<void> {
    this.couponCodeInput = localStorage.getItem('appliedCoupon') || '';
    this.basketSubscription = this.basketService.basketItems$.subscribe(async items => {
      this.basketItems = items;
      await this.calculateDiscounts();
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

  async calculateDiscounts(): Promise<void> {
    if (!this.basketItems || this.basketItems.length === 0) {
      this.discountResponse = null;
      return;
    }

    const request = new CalculateDiscountRequest();
    request.couponCode = this.couponCodeInput;
    request.items = this.basketItems.map(item => {
      const p = new CalculateDiscountItem();
      p.productId = item.productId || "";
      p.productName = item.name;
      p.categoryId = item.categoryId || "";
      p.quantity = item.quantity;
      p.unitPrice = item.price;
      return p;
    });

    try {
      this.discountResponse = await this.basketService.calculateDiscount(request);
    } catch (error) {
      console.error("Discount calculation error", error);
    }
  }

  async applyCoupon(): Promise<void> {
    if (!this.couponCodeInput) {
      this.toastrService.message("Lütfen geçerli bir kupon kodu giriniz.", "Hata", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.calculateDiscounts();
      const hasCoupon = this.discountResponse?.appliedDiscounts.find(d => d.discountType === "Coupon");
      if (hasCoupon) {
        localStorage.setItem('appliedCoupon', this.couponCodeInput);
        this.toastrService.message("Kupon başarıyla uygulandı.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      } else {
        this.toastrService.message("Geçersiz veya şartları sağlamayan kupon kodu.", "Hata", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
        this.couponCodeInput = ''; // clear invalid coupon
        localStorage.removeItem('appliedCoupon');
      }
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async removeCoupon(): Promise<void> {
    this.couponCodeInput = '';
    localStorage.removeItem('appliedCoupon');
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.calculateDiscounts();
      this.toastrService.message("Kupon kaldırıldı.", "Bilgi", {
        messageType: ToastrMessageType.Info,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }
}
