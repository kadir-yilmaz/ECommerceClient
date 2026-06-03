import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { BaseUrl } from 'src/app/contracts/base_url';
import { Create_Basket_Item } from 'src/app/contracts/basket/create_basket_item';
import { List_Product } from 'src/app/contracts/list_product';
import { Category } from 'src/app/contracts/category';
import { AuthService } from 'src/app/services/common/auth.service';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { FavoriteService } from 'src/app/services/common/models/favorite.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CampaignService } from 'src/app/services/common/models/campaign.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit {
  activeCampaigns: import('src/app/contracts/campaign/campaign').Campaign[] = [];
  featuredProducts: List_Product[] = [];
  baseUrl: BaseUrl;

  showcaseCategories: Category[] = [];
  loadedShowcaseGroups: Array<{ category: Category, products: List_Product[] }> = [];
  currentLoadingIndex: number = 0;
  isLoadingShowcase: boolean = false;

  @ViewChild('productsScroll', { static: false }) productsScroll: ElementRef;
  @ViewChild('campaignsScroll', { static: false }) campaignsScroll: ElementRef;

  constructor(
    spinner: NgxSpinnerService,
    private productService: ProductService,
    private fileService: FileService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router,
    private customToastrService: CustomToastrService,
    private campaignService: CampaignService,
    private categoryService: CategoryService
  ) {
    super(spinner);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.clientHeight;
    const max = document.documentElement.scrollHeight;
    if (pos >= max - 800) {
      this.loadNextShowcaseGroup();
    }
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      
      const productData = await this.productService.read(0, 20, undefined, undefined, undefined, true, () => { }, () => { });
      this.featuredProducts = productData.products.map<List_Product>((product) => ({
        ...product,
        imagePath: product.productImageFiles?.length
          ? (product.productImageFiles.find((image) => image.showcase)?.path ?? product.productImageFiles[0].path)
          : ''
      }));

      const allActive = await this.campaignService.getActiveCampaigns();
      this.activeCampaigns = allActive.filter(c => c.ruleType !== 'FreeShipping');

      // Load homepage showcased categories
      const categoryData = await this.categoryService.getAll();
      this.showcaseCategories = (categoryData?.categories || [])
        .filter(c => c.showOnHomepage)
        .sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0));

      // Initially load first 2 showcases
      await this.loadNextShowcaseGroup();
      await this.loadNextShowcaseGroup();
    } catch {
      this.featuredProducts = [];
      this.activeCampaigns = [];
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async loadNextShowcaseGroup(): Promise<void> {
    if (this.currentLoadingIndex >= this.showcaseCategories.length || this.isLoadingShowcase) {
      return;
    }

    this.isLoadingShowcase = true;
    const category = this.showcaseCategories[this.currentLoadingIndex];
    try {
      const response = await this.productService.read(0, 10, category.id, undefined, undefined, false, () => {}, () => {});
      const products = response.products.map<List_Product>((p) => ({
        ...p,
        imagePath: p.productImageFiles?.length
          ? (p.productImageFiles.find((img) => img.showcase)?.path ?? p.productImageFiles[0].path)
          : ''
      }));

      this.loadedShowcaseGroups.push({
        category,
        products
      });
      this.currentLoadingIndex++;
    } catch (e) {
      console.error('Error loading showcase category:', e);
    } finally {
      this.isLoadingShowcase = false;
    }
  }

  scrollCampaigns(direction: 'left' | 'right') {
    if (this.campaignsScroll) {
      const container = this.campaignsScroll.nativeElement;
      const scrollAmount = 400;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }

  scrollProducts(direction: 'left' | 'right') {
    if (this.productsScroll) {
      const container = this.productsScroll.nativeElement;
      const scrollAmount = 300;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }

  async addToBasket(product: List_Product): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = product.id;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.customToastrService.message('Urun sepete eklendi.', 'Sepete Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async onToggleFavorite(product: List_Product): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.customToastrService.message('Favorilere eklemek için giriş yapmalısınız.', 'Giriş Gerekli', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const isAdded = await this.favoriteService.toggle(product.id);
    if (isAdded) {
      this.customToastrService.message('Ürün favorilere eklendi.', 'Favorilere Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } else {
      this.customToastrService.message('Ürün favorilerden çıkarıldı.', 'Favorilerden Çıkarıldı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
    }
  }

  isProductFavorite(productId: string): boolean {
    return this.favoriteService.isFavorite(productId);
  }
}
