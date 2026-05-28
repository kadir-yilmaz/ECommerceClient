import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Create_Basket_Item } from 'src/app/contracts/basket/create_basket_item';
import { BaseUrl } from 'src/app/contracts/base_url';
import { List_Favorite_Item } from 'src/app/contracts/favorite/list_favorite_item';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { FavoriteService } from 'src/app/services/common/models/favorite.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent extends BaseComponent implements OnInit, OnDestroy {
  favoriteItems: List_Favorite_Item[] = [];
  baseUrl: BaseUrl;
  private favoriteSubscription?: Subscription;
  private basketSubscription?: Subscription;
  basketItems: any[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private favoriteService: FavoriteService,
    private basketService: BasketService,
    private fileService: FileService,
    private toastrService: CustomToastrService,
    private router: Router
  ) {
    super(spinner);
  }

  get itemCount(): number {
    return this.favoriteItems.length;
  }

  async ngOnInit(): Promise<void> {
    this.favoriteSubscription = this.favoriteService.favoriteItems$.subscribe(items => {
      this.favoriteItems = items;
    });

    this.basketSubscription = this.basketService.basketItems$.subscribe(items => {
      this.basketItems = items;
    });

    this.baseUrl = await this.fileService.getBaseStorageUrl();
    await this.loadFavorites();
    await this.basketService.get(); // Sepet verilerini getir
  }

  ngOnDestroy(): void {
    this.favoriteSubscription?.unsubscribe();
    this.basketSubscription?.unsubscribe();
  }

  isInBasket(productName: string): boolean {
    return this.basketItems.some(item => item.name === productName);
  }

  async loadFavorites(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.favoriteService.get();
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  getProductImage(item: List_Favorite_Item): string {
    if (!item.imagePath) {
      return '../../../../../assets/default-product.png';
    }

    const normalizedPath = item.imagePath.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const sanitizedBaseUrl = (this.baseUrl?.url ?? '').replace(/\/+$/, '');
    if (!sanitizedBaseUrl) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/')) {
      return `${sanitizedBaseUrl}${normalizedPath}`;
    }

    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }

  async addToBasket(item: List_Favorite_Item): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = item.productId;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.toastrService.message('Urun sepete eklendi.', 'Sepete Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async removeFavorite(item: List_Favorite_Item): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.favoriteService.remove(item.favoriteItemId);
      this.toastrService.message('Urun favorilerden kaldirildi.', 'Favoriler Guncellendi', {
        messageType: ToastrMessageType.Info,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
