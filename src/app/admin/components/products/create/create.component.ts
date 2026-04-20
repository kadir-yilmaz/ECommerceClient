import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { ProductService } from '../../../../services/common/models/product.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent extends BaseComponent implements OnInit {

  constructor(spinner: NgxSpinnerService, private productService: ProductService, private alertify: AlertifyService, private router: Router) {
    super(spinner)
  }

  ngOnInit(): void {
  }

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  onFileSelected(event: any) {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  create(name: HTMLInputElement, stock: HTMLInputElement, price: HTMLInputElement) {
    this.showSpinner(SpinnerType.BallAtom);

    const createModel = {
      name: name.value,
      stock: parseInt(stock.value) || 0,
      price: parseFloat(price.value) || 0
    };

    this.productService.create_json(createModel, async (productId: string) => {
      // Upload images if product was created and files were selected
      if (this.selectedFiles && this.selectedFiles.length > 0 && productId) {
        const formData = new FormData();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          formData.append("files", this.selectedFiles[i], this.selectedFiles[i].name);
        }
        await this.productService.uploadImages(productId, formData, () => { });
      }

      this.hideSpinner(SpinnerType.BallAtom);
      this.alertify.message("Ürün başarıyla eklenmiştir.", {
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
