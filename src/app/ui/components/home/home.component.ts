import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { BaseUrl } from 'src/app/contracts/base_url';
import { Create_Basket_Item } from 'src/app/contracts/basket/create_basket_item';
import { List_Product } from 'src/app/contracts/list_product';
import { AuthService } from 'src/app/services/common/auth.service';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { FavoriteService } from 'src/app/services/common/models/favorite.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CampaignImage, CampaignService } from 'src/app/services/common/models/campaign.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit {
  campaignSlides: CampaignImage[] = [];
  featuredProducts: List_Product[] = [];
  baseUrl: BaseUrl;

  @ViewChild('productsScroll', { static: false }) productsScroll: ElementRef;

  constructor(
    spinner: NgxSpinnerService,
    private productService: ProductService,
    private fileService: FileService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router,
    private customToastrService: CustomToastrService,
    private campaignService: CampaignService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      
      const productData = await this.productService.read(0, 8, undefined, undefined, undefined, () => { }, () => { });
      this.featuredProducts = productData.products.map<List_Product>((product) => ({
        ...product,
        imagePath: product.productImageFiles?.length
          ? (product.productImageFiles.find((image) => image.showcase)?.path ?? product.productImageFiles[0].path)
          : ''
      }));

      this.campaignSlides = await this.campaignService.getCampaignImages();
    } catch {
      this.featuredProducts = [];
      this.campaignSlides = [];
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
