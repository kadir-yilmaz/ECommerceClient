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
import { FileService } from '../../../services/common/models/file.service';
import { DiscountCoupon } from '../../../contracts/discount-coupon/discount-coupon';
import { DiscountCouponService } from '../../../services/common/models/discount-coupon.service';

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
    public authService: AuthService,
    private fileService: FileService,
    private discountCouponService: DiscountCouponService
  ) {
    super(spinner)
  }

  baseUrl: string;

  basketItems: List_Basket_Item[] = [];
  discountResponse: CalculateDiscountResponse | null = null;
  couponCodeInput: string = '';
  myCoupons: DiscountCoupon[] = [];
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
    if (this.discountResponse) return this.discountResponse.shippingFee;
    return 50;
  }

  get shippingThreshold(): number {
    return this.discountResponse?.shippingThreshold ?? 500;
  }

  get grandTotal(): number {
    return this.discountResponse ? this.discountResponse.finalTotal + this.shippingFee : this.totalPrice + this.shippingFee;
  }

  get hasCouponApplied(): boolean {
    return !!this.couponCodeInput && !!this.discountResponse?.appliedDiscounts?.some(d => d.discountName === this.couponCodeInput);
  }

  getDiscountDescription(discount: any): string {
    if (discount?.description) {
      return discount.description;
    }

    if (discount.discountType === 'Campaign') {
      return 'Kampanya uygulandı. İndirim tutarı sepetinize yansıtıldı.';
    }

    if (discount.discountType === 'Coupon') {
      return 'Kupon kodu başarıyla kullanıldı. İndirim sepetinize uygulandı.';
    }

    return 'İndirim tutarı sepetinize eklendi.';
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
    const baseUrlObj = await this.fileService.getBaseStorageUrl();
    this.baseUrl = baseUrlObj.url;

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
    this.authSubscription = this.authService.isAuthenticated$.subscribe(async () => {
      this.loadBasket();
      if (this.authService.isAuthenticated) {
        await this.loadMyCoupons();
      } else {
        this.myCoupons = [];
      }
    });
    
    if (this.authService.isAuthenticated) {
      await this.loadMyCoupons();
    }
    await this.loadBasket();
  }

  async loadMyCoupons(): Promise<void> {
    try {
      const coupons = await this.discountCouponService.getMyCoupons();
      // Filter out used or expired coupons
      this.myCoupons = (coupons || []).filter(c => !c.isUsed && !c.isExpired);
    } catch (error) {
      console.error('Error loading my coupons:', error);
    }
  }

  async selectCoupon(event: Event): Promise<void> {
    const selectElement = event.target as HTMLSelectElement;
    const selectedCode = selectElement.value;
    if (selectedCode) {
      this.couponCodeInput = selectedCode;
      await this.applyCoupon();
    } else {
      await this.removeCoupon();
    }
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
      p.brand = item.brand;
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

  onCouponInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    this.couponCodeInput = upper;
    input.value = upper;
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
      const hasCoupon = this.discountResponse?.appliedDiscounts.some(d => d.discountName === this.couponCodeInput);
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

  getItemDiscountAmount(item: List_Basket_Item): number {
    if (!this.discountResponse || !item.campaigns || item.campaigns.length === 0) return 0;

    let totalItemDiscount = 0;

    for (const campaign of item.campaigns) {
      // Check if this campaign was actually applied
      const isApplied = this.discountResponse.appliedDiscounts.some(ad => 
        ad.discountType === 'Campaign' && ad.discountName === campaign.name
      );
      if (!isApplied) continue;

      if (campaign.ruleType === 'BrandDiscount' || campaign.ruleType === 'CategoryDiscount' || campaign.ruleType === 'SelectedProductsDiscount') {
        const rate = campaign.discountRate || 0;
        const discount = (item.price * item.quantity) * (rate / 100);
        totalItemDiscount += discount;
      } 
      else if (campaign.ruleType === 'FreeItem') {
        const minQty = campaign.minQuantity || 1;
        const freeQty = campaign.freeQuantity || 0;
        const sets = Math.floor(item.quantity / minQty);
        const freeCount = sets * freeQty;
        totalItemDiscount += freeCount * item.price;
      } 
      else if (campaign.ruleType === 'CheapestItemDiscount') {
        if (this.isCampaignConditionMet(campaign) && this.isCheapestItemInCampaign(item, campaign)) {
          const rate = campaign.discountRate || 0;
          totalItemDiscount += item.price * (rate / 100);
        }
      }
    }

    return Math.round(totalItemDiscount * 100) / 100;
  }

  isCheapestItemInCampaign(basketItem: List_Basket_Item, campaign: any): boolean {
    if (!campaign || campaign.ruleType !== 'CheapestItemDiscount') return false;

    let targetedItems = this.basketItems;
    if (campaign.categoryId) {
      targetedItems = this.basketItems.filter(item => 
        item.categoryId && item.categoryId.toLowerCase() === campaign.categoryId.toLowerCase()
      );
    } else if (campaign.productId) {
      targetedItems = this.basketItems.filter(item => 
        item.productId && item.productId.toLowerCase() === campaign.productId.toLowerCase()
      );
    } else {
      return false;
    }

    if (targetedItems.length === 0) return false;

    const minPrice = Math.min(...targetedItems.map(item => item.price));
    return basketItem.price === minPrice;
  }

  isCampaignConditionMet(campaign: any): boolean {
    if (!campaign) return false;
    if (campaign.ruleType === 'CheapestItemDiscount' || campaign.ruleType === 'FreeItem') {
      const minQty = campaign.minQuantity || 0;
      if (minQty <= 0) return true;

      let targetedItems = this.basketItems;
      if (campaign.categoryId) {
        targetedItems = this.basketItems.filter(item => 
          item.categoryId && item.categoryId.toLowerCase() === campaign.categoryId.toLowerCase()
        );
      } else if (campaign.productId) {
        targetedItems = this.basketItems.filter(item => 
          item.productId && item.productId.toLowerCase() === campaign.productId.toLowerCase()
        );
      }
      
      const totalQty = targetedItems.reduce((sum, item) => sum + item.quantity, 0);
      return totalQty >= minQty;
    }
    return true;
  }

  getRemainingQuantityForCampaign(campaign: any): number {
    if (!campaign) return 0;
    const minQty = campaign.minQuantity || 0;
    if (minQty <= 0) return 0;

    let targetedItems = this.basketItems;
    if (campaign.categoryId) {
      targetedItems = this.basketItems.filter(item => 
        item.categoryId && item.categoryId.toLowerCase() === campaign.categoryId.toLowerCase()
      );
    } else if (campaign.productId) {
      targetedItems = this.basketItems.filter(item => 
        item.productId && item.productId.toLowerCase() === campaign.productId.toLowerCase()
      );
    }
    
    const totalQty = targetedItems.reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, minQty - totalQty);
  }

  getProductImage(path?: string): string {
    if (!path) return '../../../../../assets/default-product.png';
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    if (!this.baseUrl) return '../../../../../assets/default-product.png';
    const sanitizedBaseUrl = this.baseUrl.replace(/\/+$/, '');
    if (normalizedPath.startsWith('/')) return `${sanitizedBaseUrl}${normalizedPath}`;
    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }
}
