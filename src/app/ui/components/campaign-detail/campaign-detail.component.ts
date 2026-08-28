import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Campaign } from 'src/app/contracts/campaign/campaign';
import { CampaignService } from 'src/app/services/common/models/campaign.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { BaseUrl } from 'src/app/contracts/base_url';
import { List_Product } from 'src/app/contracts/list_product';
import { List_Basket_Item } from 'src/app/contracts/basket/list_basket_item';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { FavoriteService } from 'src/app/services/common/models/favorite.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { Create_Basket_Item } from 'src/app/contracts/basket/create_basket_item';
import { generateProductUrl } from 'src/app/utils/slug-utils';

@Component({
  selector: 'app-campaign-detail',
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.scss']
})
export class CampaignDetailComponent extends BaseComponent implements OnInit, OnDestroy {
  campaign: Campaign;
  product: List_Product;
  campaignProducts: List_Product[] = [];
  baseUrl: BaseUrl;
  basketItems: List_Basket_Item[] = [];
  private basketSubscription: Subscription;

  // Pagination for campaign products
  currentProductPage: number = 1;
  productsPerPage: number = 10; // 2 satır x 5 ürün
  totalCampaignProducts: number = 0;
  get paginatedCampaignProducts(): List_Product[] {
    const startIndex = (this.currentProductPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    return this.campaignProducts.slice(startIndex, endIndex);
  }
  get totalProductPages(): number {
    return Math.ceil(this.totalCampaignProducts / this.productsPerPage);
  }
  get productPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalProductPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  constructor(
    spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private productService: ProductService,
    private fileService: FileService,
    private toastrService: CustomToastrService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private authService: AuthService
  ) {
    super(spinner);
  }

  isCampaignExpired(): boolean {
    if (!this.campaign?.endDate) return false;
    return new Date(this.campaign.endDate) < new Date();
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    
    // Subscribe to basket changes
    this.basketSubscription = this.basketService.basketItems$.subscribe(items => {
      this.basketItems = items;
    });
    
    // Load basket items
    await this.basketService.get();
    
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.campaign = await this.campaignService.getCampaignById(id);
        
        // Single product preview legacy behavior
        if (this.campaign.productId && !this.campaign.productId.includes(',')) {
          this.product = await this.productService.readById(this.campaign.productId);
          if (this.product && this.product.productImageFiles) {
            const showcaseImage = this.product.productImageFiles.find(img => img.showcase);
            this.product.imagePath = showcaseImage ? showcaseImage.path : (this.product.productImageFiles[0]?.path || '');
          }
        }

        // Dynamically load eligible products for the campaign
        if (!this.isCampaignExpired()) {
          await this.loadCampaignProducts();
        }
      } else {
        this.router.navigate(['/']);
      }
    } catch (error) {
      this.toastrService.message("Kampanya bulunamadı veya bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  ngOnDestroy(): void {
    if (this.basketSubscription) {
      this.basketSubscription.unsubscribe();
    }
  }

  async loadCampaignProducts() {
    this.campaignProducts = [];
    this.currentProductPage = 1;
    if (!this.campaign) return;

    let categoryId = this.campaign.categoryId;
    let brand = this.campaign.brand;
    let productIds = this.campaign.productId;

    try {
      if (this.campaign.ruleType === 'BrandDiscount' && brand) {
        const res = await this.productService.read(0, 1000, categoryId || undefined, undefined, undefined, false, undefined, undefined, brand);
        this.campaignProducts = res.products.map(p => this.mapProduct(p));
        this.totalCampaignProducts = res.products.length;
      } else if ((this.campaign.ruleType === 'CategoryDiscount' || this.campaign.ruleType === 'CheapestItemDiscount') && categoryId) {
        const res = await this.productService.read(0, 1000, categoryId, undefined, undefined, false, undefined, undefined, brand || undefined);
        this.campaignProducts = res.products.map(p => this.mapProduct(p));
        this.totalCampaignProducts = res.products.length;
      } else if (this.campaign.ruleType === 'SelectedProductsDiscount' && productIds) {
        const res = await this.productService.read(0, 1000, undefined, undefined, undefined, false, undefined, undefined, undefined, productIds);
        this.campaignProducts = res.products.map(p => this.mapProduct(p));
        this.totalCampaignProducts = res.products.length;
      } else if (this.campaign.ruleType === 'TotalAmountDiscount') {
        if (productIds) {
          const res = await this.productService.read(0, 1000, undefined, undefined, undefined, false, undefined, undefined, undefined, productIds);
          this.campaignProducts = res.products.map(p => this.mapProduct(p));
          this.totalCampaignProducts = res.products.length;
        } else if (categoryId) {
          const res = await this.productService.read(0, 1000, categoryId, undefined, undefined, false, undefined, undefined, brand || undefined);
          this.campaignProducts = res.products.map(p => this.mapProduct(p));
          this.totalCampaignProducts = res.products.length;
        }
      } else if (this.campaign.ruleType === 'FreeItem' && productIds) {
        const res = await this.productService.read(0, 1000, undefined, undefined, undefined, false, undefined, undefined, undefined, productIds);
        this.campaignProducts = res.products.map(p => this.mapProduct(p));
        this.totalCampaignProducts = res.products.length;
      }
    } catch (e) {
      console.error('Error loading products for campaign:', e);
    }
  }

  goToProductPage(page: number): void {
    if (page >= 1 && page <= this.totalProductPages) {
      this.currentProductPage = page;
      // Scroll to products section
      const productsSection = document.querySelector('.campaign-product-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  mapProduct(p: List_Product): List_Product {
    p.imagePath = p.productImageFiles?.length
      ? (p.productImageFiles.find(img => img.showcase)?.path ?? p.productImageFiles[0].path)
      : '';
    return p;
  }

  getProductImage(path?: string): string {
    if (!path) return '../../../../../assets/default-product.png';
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    const sanitizedBaseUrl = (this.baseUrl?.url ?? '').replace(/\/+$/, '');
    if (!sanitizedBaseUrl) return normalizedPath;
    if (normalizedPath.startsWith('/')) return `${sanitizedBaseUrl}${normalizedPath}`;
    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }

  goToProduct(): void {
    if (this.product) {
      this.router.navigateByUrl(generateProductUrl(this.product));
    } else if (this.campaign?.productId) {
      this.router.navigateByUrl(generateProductUrl({ id: this.campaign.productId }));
    }
  }

  isProductInBasket(productId: string): boolean {
    return this.basketItems.some(item => item.productId === productId);
  }

  async addToBasket(product: List_Product): Promise<void> {
    // Check if product is already in basket
    if (this.isProductInBasket(product.id)) {
      this.toastrService.message('Bu ürün zaten sepetinizde.', 'Ürün Sepette', {
        messageType: ToastrMessageType.Info,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = product.id;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.toastrService.message('Ürün sepete eklendi.', 'Sepete Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async onToggleFavorite(product: List_Product): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.toastrService.message('Favorilere eklemek için giriş yapmalısınız.', 'Giriş Gerekli', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const isAdded = await this.favoriteService.toggle(product.id);
    if (isAdded) {
      this.toastrService.message('Ürün favorilere eklendi.', 'Favorilere Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } else {
      this.toastrService.message('Ürün favorilerden çıkarıldı.', 'Favorilerden Çıkarıldı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
    }
  }

  isProductFavorite(productId: string): boolean {
    return this.favoriteService.isFavorite(productId);
  }

  // Template helper
  Math = Math;
}
