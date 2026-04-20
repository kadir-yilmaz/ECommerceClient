import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_Product } from '../../../../contracts/list_product';
import { List_Product_Image } from '../../../../contracts/list_product_image';
import { BaseUrl } from '../../../../contracts/base_url';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { FileService } from '../../../../services/common/models/file.service';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent extends BaseComponent implements OnInit {

  productId: string;
  product: List_Product;
  existingImages: List_Product_Image[] = [];
  baseUrl: BaseUrl;
  selectedFiles: File[] = [];
  newImagePreviews: string[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private alertify: AlertifyService,
    private fileService: FileService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallAtom);
    this.baseUrl = await this.fileService.getBaseStorageUrl();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.product = await this.productService.readById(this.productId,
        () => { },
        (error) => {
          this.alertify.message("Ürün bulunamadı.", { dismissOthers: true, messageType: MessageType.Error, position: Position.BottomRight });
          this.router.navigate(['/admin/products']);
        }
      );

      this.existingImages = await this.productService.readImages(this.productId, () => { });
    }
    this.hideSpinner(SpinnerType.BallAtom);
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return (this.baseUrl?.url || '') + '/' + path;
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newImagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeNewImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
  }

  async deleteExistingImage(imageId: string, index: number) {
    this.showSpinner(SpinnerType.BallAtom);
    await this.productService.deleteImage(this.productId, imageId, () => {
      this.hideSpinner(SpinnerType.BallAtom);
      this.existingImages.splice(index, 1);
      this.alertify.message("Görsel silindi.", {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
    });
  }

  async update(name: HTMLInputElement, stock: HTMLInputElement, price: HTMLInputElement) {
    this.showSpinner(SpinnerType.BallAtom);

    const updateModel = {
      id: this.productId,
      name: name.value,
      stock: parseInt(stock.value),
      price: parseFloat(price.value)
    };

    this.productService.update_json(updateModel, async () => {
      // Upload new images if any
      if (this.selectedFiles && this.selectedFiles.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          formData.append("files", this.selectedFiles[i], this.selectedFiles[i].name);
        }
        await this.productService.uploadImages(this.productId, formData, () => { });
      }

      this.hideSpinner(SpinnerType.BallAtom);
      this.alertify.message("Ürün başarıyla güncellenmiştir.", {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });

      this.router.navigate(['/admin/products']);
    }, errorMessage => {
      this.hideSpinner(SpinnerType.BallAtom);
      this.alertify.message(errorMessage, {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    });
  }
}
