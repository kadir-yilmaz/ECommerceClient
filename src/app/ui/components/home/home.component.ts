import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { BaseUrl } from 'src/app/contracts/base_url';
import { Create_Basket_Item } from 'src/app/contracts/basket/create_basket_item';
import { List_Product } from 'src/app/contracts/list_product';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit {
  campaignSlides = [
    {
      title: 'Sezonun En Cok Satanlari',
      description: 'Ihtiyacin olan urunleri tek sepette topla, hizli teslimatla kapina gelsin.',
      imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1800&q=80'
    },
    {
      title: 'Haftaya Ozel Firsatlar',
      description: 'Elektronikten yasam urunlerine kadar secili urunlerde kacirilmayacak fiyatlar.',
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1800&q=80'
    },
    {
      title: 'Yeni Gelenler Raflarda',
      description: 'Trend urunleri incele, stok bitmeden hemen siparis ver.',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=80'
    }
  ];

  featuredProducts: List_Product[] = [];
  baseUrl: BaseUrl;

  constructor(
    spinner: NgxSpinnerService,
    private productService: ProductService,
    private fileService: FileService,
    private basketService: BasketService,
    private customToastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      const productData = await this.productService.read(0, 8, () => { }, () => { });
      this.featuredProducts = productData.products.map<List_Product>((product) => ({
        ...product,
        imagePath: product.productImageFiles?.length
          ? (product.productImageFiles.find((image) => image.showcase)?.path ?? product.productImageFiles[0].path)
          : ''
      }));
    } catch {
      this.featuredProducts = [];
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
}
