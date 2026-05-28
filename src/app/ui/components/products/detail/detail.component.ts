import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { BaseUrl } from '../../../../contracts/base_url';
import { Create_Basket_Item } from '../../../../contracts/basket/create_basket_item';
import { List_Product } from '../../../../contracts/list_product';
import { List_Product_Image } from '../../../../contracts/list_product_image';
import { BasketService } from '../../../../services/common/models/basket.service';
import { FileService } from '../../../../services/common/models/file.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent extends BaseComponent implements OnInit {
  baseUrl: BaseUrl;
  product: List_Product;
  selectedImagePath: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private fileService: FileService,
    private basketService: BasketService,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    this.baseUrl = await this.fileService.getBaseStorageUrl();

    this.activatedRoute.params.subscribe(async (params) => {
      const productId = params["id"];
      this.product = await this.productService.readById(productId, () => { }, () => { });
      const images: List_Product_Image[] = await this.productService.readImages(productId, () => { });
      this.product.productImageFiles = images;
      this.selectedImagePath = this.getShowcaseImagePath();
      this.hideSpinner(SpinnerType.BallAtom);
    });
  }

  getProductImage(path: string): string {
    if (!path) {
      return "";
    }

    const normalizedPath = path.replace(/\\/g, "/");
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const sanitizedBaseUrl = (this.baseUrl?.url ?? "").replace(/\/+$/, "");
    if (normalizedPath.startsWith("/")) {
      return `${sanitizedBaseUrl}${normalizedPath}`;
    }

    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }

  getShowcaseImagePath(): string {
    const showcaseImage = this.product?.productImageFiles?.find(image => image.showcase);
    return showcaseImage?.path
      ?? this.product?.productImageFiles?.[0]?.path
      ?? this.product?.imagePath
      ?? "";
  }

  selectImage(path: string): void {
    this.selectedImagePath = path;
  }

  nextImage(): void {
    if (!this.product?.productImageFiles?.length) return;
    const currentIndex = this.product.productImageFiles.findIndex(img => img.path === this.selectedImagePath);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % this.product.productImageFiles.length;
    this.selectedImagePath = this.product.productImageFiles[nextIndex].path;
  }

  prevImage(): void {
    if (!this.product?.productImageFiles?.length) return;
    const currentIndex = this.product.productImageFiles.findIndex(img => img.path === this.selectedImagePath);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + this.product.productImageFiles.length) % this.product.productImageFiles.length;
    this.selectedImagePath = this.product.productImageFiles[prevIndex].path;
  }

  get originalPrice(): number {
    return this.product?.price ? this.product.price * 1.20 : 0;
  }

  get reviewCount(): number {
    if(!this.product) return 0;
    return (this.product.name.length * 87) % 15000 + 150;
  }

  get rating(): number {
    if(!this.product) return 0;
    return 4 + (this.product.name.length % 10) / 10;
  }

  get brandName(): string {
    if(!this.product || !this.product.name) return '';
    return this.product.name.split(' ')[0].toUpperCase();
  }

  get soldCount(): string {
    if(!this.product) return '';
    const count = (this.product.name.length * 42) % 3000 + 500;
    return count > 1000 ? `${(count/1000).toFixed(1)}B+` : `${count}`;
  }


  async addToBasket(): Promise<void> {
    if (!this.product) {
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = this.product.id;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.customToastrService.message("Urun sepete eklendi.", "Sepete Eklendi", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } catch (error) {
      this.customToastrService.message("Urun sepete eklenirken bir hata olustu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }
}
