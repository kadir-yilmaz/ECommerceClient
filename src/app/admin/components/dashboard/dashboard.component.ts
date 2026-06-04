import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { AlertifyService, MessageType, Position } from 'src/app/services/admin/alertify.service';
import { HubUrls } from '../../../constants/hub-urls';
import { ReceiveFunctions } from '../../../constants/receive-functions';
import { SignalRService } from '../../../services/common/signalr.service';
import { DashboardService, DashboardOverview } from '../../../services/common/models/dashboard.service';
import { CategoryService } from '../../../services/common/models/category.service';
import { Category } from 'src/app/contracts/category';
import { ProductService } from 'src/app/services/common/models/product.service';
import { List_Product } from 'src/app/contracts/list_product';
import { FileService } from 'src/app/services/common/models/file.service';
import { BaseUrl } from 'src/app/contracts/base_url';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit {
  overview: DashboardOverview = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  };

  categoryStats: any[] = [];
  
  showcaseProductsDataSource: MatTableDataSource<List_Product> = null;
  displayedColumns: string[] = ['photo', 'name', 'stock', 'price', 'showcase', 'edit'];
  baseUrl: BaseUrl;

  constructor(
    private alertify: AlertifyService,
    spinner: NgxSpinnerService,
    private signalRService: SignalRService,
    private dashboardService: DashboardService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private fileService: FileService
  ) {
    super(spinner)
  }

  async ngOnInit(): Promise<void> {
    this.signalRService.on(HubUrls.ProductHub, ReceiveFunctions.ProductAddedMessageReceiveFunction, message => {
      this.alertify.message(message, {
        messageType: MessageType.Notify,
        position: Position.BottomRight
      })
    });
    this.signalRService.on(HubUrls.OrderHub, ReceiveFunctions.OrderAddedMessageReceiveFunction, message => {
      this.alertify.message(message, {
        messageType: MessageType.Notify,
        position: Position.TopCenter
      })
    });

    await this.loadData();
  }

  buildTree(categories: Category[], parentId: string = null): any[] {
    return categories
      .filter(c => (c.parentCategoryId || null) === parentId)
      .map(c => {
        const children = this.buildTree(categories, c.id);
        const childrenProductCount = children.reduce((sum, child) => sum + (child.totalProductCount || 0), 0);
        return {
          ...c,
          children: children,
          totalProductCount: (c.productCount || 0) + childrenProductCount
        };
      });
  }

  async loadData() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      this.overview = await this.dashboardService.getOverview();
      const categoriesResult = await this.categoryService.getAll();
      if (categoriesResult && categoriesResult.categories) {
        const tree = this.buildTree(categoriesResult.categories);
        this.categoryStats = tree;
      }
      
      // Load showcase products
      const productsData = await this.productService.read(0, 100, undefined, undefined, undefined, true);
      const mappedProducts = productsData.products.map<List_Product>(p => {
        const showcaseImage = p.productImageFiles?.find(img => img.showcase);
        const path = showcaseImage ? showcaseImage.path : (p.productImageFiles?.length ? p.productImageFiles[0].path : "");
        return {
          ...p,
          imagePath: path
        };
      });
      this.showcaseProductsDataSource = new MatTableDataSource<List_Product>(mappedProducts);
      
    } catch (error) {
      this.alertify.message("Dashboard verileri alınırken hata oluştu.", {
        messageType: MessageType.Error,
        position: Position.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async refreshData() {
    await this.loadData();
    this.alertify.message("Veriler güncellendi", {
      messageType: MessageType.Success,
      position: Position.BottomRight
    });
  }

  m() {
    this.alertify.message("Merhaba", {
      messageType: MessageType.Success,
      delay: 5,
      position: Position.BottomRight
    })
  }

  formatPrice(price: number): string {
    if (price == null || isNaN(price)) return '';
    const hasDecimal = price % 1 !== 0;
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0
    }) + ' TL';
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '../../../../../assets/default-product.png';
  }

  async toggleShowcase(productId: string, showOnHomepage: boolean) {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.productService.changeShowcaseStatus(productId, showOnHomepage);
      this.alertify.message(showOnHomepage ? "Ürün vitrine eklendi." : "Ürün vitrinden kaldırıldı.", {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
      await this.loadData();
    } catch (error) {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }
}
