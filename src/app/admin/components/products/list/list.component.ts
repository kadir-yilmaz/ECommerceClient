import { ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {
  constructor(spinner: NgxSpinnerService,
    private productService: ProductService,
    private alertifyService: AlertifyService,
    private fileService: FileService,
    private dialog: MatDialog) {
    super(spinner)
  }

  displayedColumns: string[] = ['photo', 'name', 'stock', 'price', 'createdDate', 'updatedDate', 'qrcode', 'edit', 'delete'];
  dataSource: MatTableDataSource<List_Product> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  baseUrl: BaseUrl;

  searchTerm: string = '';
  private searchSubject: Subject<string> = new Subject<string>();

  async getProducts() {
    this.showSpinner(SpinnerType.BallAtom);
    const allProducts: { totalProductCount: number; products: List_Product[] } = await this.productService.read(this.paginator ? this.paginator.pageIndex : 0, this.paginator ? this.paginator.pageSize : 5, undefined, undefined, this.searchTerm, () => this.hideSpinner(SpinnerType.BallAtom), errorMessage => this.alertifyService.message(errorMessage, {
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
        productImageFiles: p.productImageFiles
      };

      return listProduct;
    });

    this.dataSource = new MatTableDataSource<List_Product>(allProducts.products);
    this.paginator.length = allProducts.totalProductCount;
  }

  async pageChanged() {
    await this.getProducts();
  }

  async ngOnInit() {
    this.baseUrl = await this.fileService.getBaseStorageUrl();
    
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(async (text) => {
      this.searchTerm = text;
      if (this.paginator) {
        this.paginator.pageIndex = 0; // Reset page number on search
      }
      await this.getProducts();
    });

    await this.getProducts();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  clearSearch(searchInput: HTMLInputElement) {
    searchInput.value = '';
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '../../../../../assets/default-product.png';
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
