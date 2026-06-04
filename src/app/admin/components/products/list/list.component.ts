import { ViewChild, ElementRef } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_Product } from '../../../../contracts/list_product';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { FileService } from '../../../../services/common/models/file.service';
import { BaseUrl } from '../../../../contracts/base_url';
import { QrcodeDialogComponent } from '../../../../dialogs/qrcode-dialog/qrcode-dialog.component';
import { QrcodeReadingDialogComponent } from '../../../../dialogs/qrcode-reading-dialog/qrcode-reading-dialog.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CategoryService } from '../../../../services/common/models/category.service';
import { Category } from '../../../../contracts/category';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {
  constructor(spinner: NgxSpinnerService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private alertifyService: AlertifyService,
    private fileService: FileService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router) {
    super(spinner)
  }

  displayedColumns: string[] = ['photo', 'name', 'stock', 'price', 'showcase', 'qrcode', 'edit', 'delete'];
  dataSource: MatTableDataSource<List_Product> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('searchInput') searchInput: ElementRef;
  baseUrl: BaseUrl;

  searchTerm: string = '';
  private searchSubject: Subject<string> = new Subject<string>();

  allCategories: Category[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];

  selectedMainCategoryId: string = '';
  selectedSubCategoryId: string = '';
  activeCategoryId: string = '';

  async getProducts() {
    this.showSpinner(SpinnerType.BallAtom);
    const allProducts: { totalProductCount: number; products: List_Product[] } = await this.productService.read(this.paginator ? this.paginator.pageIndex : 0, this.paginator ? this.paginator.pageSize : 20, this.activeCategoryId || undefined, undefined, this.searchTerm, undefined, () => this.hideSpinner(SpinnerType.BallAtom), errorMessage => this.alertifyService.message(errorMessage, {
      dismissOthers: true,
      messageType: MessageType.Error,
      position: Position.BottomRight
    }))

    allProducts.products = allProducts.products.map<List_Product>(p => {
      const showcaseImage = p.productImageFiles?.find(img => img.showcase);
      const path = showcaseImage ? showcaseImage.path : (p.productImageFiles?.length ? p.productImageFiles[0].path : "");

      const listProduct: List_Product = {
        id: p.id,
        createdDate: p.createdDate,
        imagePath: path,
        name: p.name,
        price: p.price,
        stock: p.stock,
        updatedDate: p.updatedDate,
        productImageFiles: p.productImageFiles,
        showOnHomepage: p.showOnHomepage,
        brand: p.brand
      };

      return listProduct;
    });

    this.dataSource = new MatTableDataSource<List_Product>(allProducts.products);
    this.paginator.length = allProducts.totalProductCount;
  }

  async pageChanged() {
    this.updateUrlParams();
    await this.getProducts();
  }

  formatPrice(price: number): string {
    if (price == null || isNaN(price)) return '';
    const hasDecimal = price % 1 !== 0;
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0
    }) + ' TL';
  }

  async ngOnInit() {
    this.baseUrl = await this.fileService.getBaseStorageUrl();
    await this.loadCategories();
    
    const params = this.route.snapshot.queryParams;
    if (params['search']) {
      this.searchTerm = params['search'];
    }
    if (params['mainCategory']) {
      this.selectedMainCategoryId = params['mainCategory'];
      this.subCategories = this.allCategories.filter(c => c.parentCategoryId === this.selectedMainCategoryId);
    }
    if (params['subCategory']) {
      this.selectedSubCategoryId = params['subCategory'];
    }
    this.activeCategoryId = this.selectedSubCategoryId || this.selectedMainCategoryId || '';
    
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(async (text) => {
      this.searchTerm = text;
      if (this.paginator) {
        this.paginator.pageIndex = 0; // Reset page number on search
      }
      this.updateUrlParams();
      await this.getProducts();
    });

    // Paginator is not available yet, we set it in AfterViewInit or just wait for it.
    // Actually, getProducts will use paginator if available, otherwise defaults to 0.
    // We will call getProducts inside ngAfterViewInit instead if page param exists, but for now we call it here.
    setTimeout(async () => {
      if (params['page'] && this.paginator) {
        this.paginator.pageIndex = +params['page'];
      }
      if (this.searchInput && this.searchTerm) {
        this.searchInput.nativeElement.value = this.searchTerm;
      }
      await this.getProducts();
    });
  }

  updateUrlParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm || null,
        mainCategory: this.selectedMainCategoryId || null,
        subCategory: this.selectedSubCategoryId || null,
        page: (this.paginator && this.paginator.pageIndex > 0) ? this.paginator.pageIndex : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  clearSearch(searchInput: HTMLInputElement) {
    searchInput.value = '';
    this.searchTerm = '';
    this.searchSubject.next('');
    this.updateUrlParams();
  }

  async loadCategories() {
    try {
      const result = await this.categoryService.getAll();
      this.allCategories = result.categories || [];
      this.mainCategories = this.allCategories.filter(c => !c.parentCategoryId);
    } catch (error) {
      console.error("Kategoriler yüklenemedi", error);
    }
  }

  onMainCategoryChange(categoryId: string) {
    this.selectedMainCategoryId = categoryId;
    this.selectedSubCategoryId = '';
    
    if (categoryId) {
      this.subCategories = this.allCategories.filter(c => c.parentCategoryId === categoryId);
      this.activeCategoryId = categoryId;
    } else {
      this.subCategories = [];
      this.activeCategoryId = '';
    }
    
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.updateUrlParams();
    this.getProducts();
  }

  onSubCategoryChange(categoryId: string) {
    this.selectedSubCategoryId = categoryId;
    
    if (categoryId) {
      this.activeCategoryId = categoryId;
    } else {
      this.activeCategoryId = this.selectedMainCategoryId;
    }
    
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.updateUrlParams();
    this.getProducts();
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '../../../../../assets/default-product.png';
  }

  async toggleShowcase(productId: string, showOnHomepage: boolean) {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.productService.changeShowcaseStatus(productId, showOnHomepage);
      this.alertifyService.message(showOnHomepage ? "Ürün vitrine eklendi." : "Ürün vitrinden kaldırıldı.", {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
    } catch (error) {
      this.alertifyService.message("Vitrin durumu güncellenemedi.", {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
      await this.getProducts();
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  showQrCode(productId: string) {
    this.dialog.open(QrcodeDialogComponent, {
      data: productId,
      width: '400px'
    });
  }

  openQrCodeReadingDialog() {
    const dialogRef = this.dialog.open(QrcodeReadingDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getProducts(); // Refresh list after stock update via QR
    });
  }
}
