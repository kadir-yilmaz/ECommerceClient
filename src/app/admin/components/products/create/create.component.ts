import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { Category } from '../../../../contracts/category';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { CategoryService } from '../../../../services/common/models/category.service';
import { ProductService } from '../../../../services/common/models/product.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent extends BaseComponent implements OnInit {

  allCategories: Category[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];
  selectedMainCategoryId: string = '';
  selectedSubCategoryId: string = '';

  brands: string[] = [];
  filteredBrands: string[] = [];
  brandText: string = '';

  constructor(spinner: NgxSpinnerService, private productService: ProductService, private categoryService: CategoryService, private alertify: AlertifyService, private router: Router, private http: HttpClient) {
    super(spinner)
  }

  async ngOnInit() {
    const result = await this.categoryService.getAll();
    this.allCategories = result.categories || [];
    this.mainCategories = this.allCategories.filter(c => !c.parentCategoryId);
    
    this.http.get<string[]>('assets/brands.json').subscribe(data => {
      this.brands = data;
      this.filteredBrands = data;
    });
  }

  onMainCategoryChange(categoryId: string) {
    this.selectedMainCategoryId = categoryId;
    this.selectedSubCategoryId = '';
    
    if (categoryId) {
      this.subCategories = this.allCategories.filter(c => c.parentCategoryId === categoryId);
    } else {
      this.subCategories = [];
    }
  }

  filterBrands(val: string) {
    const search = val?.toLowerCase() || '';
    this.filteredBrands = this.brands.filter(b => b.toLowerCase().includes(search));
  }

  onBrandSelected(event: any) {
    this.brandText = event.option.value;
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

    const createModel: any = {
      name: name.value,
      stock: parseInt(stock.value) || 0,
      price: parseFloat(price.value) || 0,
      brand: this.brandText
    };
    if (this.selectedSubCategoryId) {
      createModel.categoryId = this.selectedSubCategoryId;
    } else if (this.selectedMainCategoryId) {
      createModel.categoryId = this.selectedMainCategoryId;
    }

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
