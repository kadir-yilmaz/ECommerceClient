import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { Category } from '../../../../contracts/category';
import { List_Product } from '../../../../contracts/list_product';
import { List_Product_Image } from '../../../../contracts/list_product_image';
import { BaseUrl } from '../../../../contracts/base_url';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { CategoryService } from '../../../../services/common/models/category.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { FileService } from '../../../../services/common/models/file.service';

import { HttpClient } from '@angular/common/http';

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
  allCategories: Category[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];
  selectedMainCategoryId: string = '';
  selectedSubCategoryId: string = '';

  brands: string[] = [];
  filteredBrands: string[] = [];
  brandText: string = '';

  constructor(
    spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private alertify: AlertifyService,
    private fileService: FileService,
    private http: HttpClient
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallAtom);
    this.baseUrl = await this.fileService.getBaseStorageUrl();

    this.http.get<string[]>('assets/brands.json').subscribe(data => {
      this.brands = data;
      this.filteredBrands = data;
    });

    const catResult = await this.categoryService.getAll();
    this.allCategories = catResult.categories || [];
    this.mainCategories = this.allCategories.filter(c => !c.parentCategoryId);

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      try {
        this.product = await this.productService.readById(this.productId,
          () => { },
          (error) => {
            this.alertify.message("Ürün bulunamadı.", { dismissOthers: true, messageType: MessageType.Error, position: Position.BottomRight });
            this.router.navigate(['/admin/products']);
          }
        );

        if (this.product?.categoryId) {
          const category = this.allCategories.find(c => c.id === this.product.categoryId);
          if (category) {
            if (category.parentCategoryId) {
              this.selectedMainCategoryId = category.parentCategoryId;
              this.subCategories = this.allCategories.filter(c => c.parentCategoryId === this.selectedMainCategoryId);
              this.selectedSubCategoryId = category.id;
            } else {
              this.selectedMainCategoryId = category.id;
              this.subCategories = this.allCategories.filter(c => c.parentCategoryId === this.selectedMainCategoryId);
            }
          }
        }
        if (this.product?.brand) {
          this.brandText = this.product.brand;
        }

        this.existingImages = await this.productService.readImages(this.productId, () => { });
      } catch (error) {
        this.hideSpinner(SpinnerType.BallAtom);
      }
    }
    this.hideSpinner(SpinnerType.BallAtom);
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
    if (confirm("Bu ürün görselini silmek istediğinize emin misiniz?")) {
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
  }

  async setAsShowcase(imageId: string) {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.productService.changeShowcaseImage(imageId, this.productId, () => {
        this.existingImages.forEach(img => img.showcase = false);
        const selected = this.existingImages.find(img => img.id === imageId);
        if (selected) selected.showcase = true;
        
        this.hideSpinner(SpinnerType.BallAtom);
        this.alertify.message("Vitrin resmi güncellendi.", {
          dismissOthers: true,
          messageType: MessageType.Success,
          position: Position.BottomRight
        });
      });
    } catch (error) {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async update(name: HTMLInputElement, stock: HTMLInputElement, price: HTMLInputElement) {
    this.showSpinner(SpinnerType.BallAtom);

    const updateModel: any = {
      id: this.productId,
      name: name.value,
      stock: parseInt(stock.value),
      price: parseFloat(price.value),
      brand: this.brandText
    };
    if (this.selectedSubCategoryId) {
      updateModel.categoryId = this.selectedSubCategoryId;
    } else if (this.selectedMainCategoryId) {
      updateModel.categoryId = this.selectedMainCategoryId;
    }

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

      this.router.navigate(['/admin/products'], { queryParamsHandling: 'preserve' });
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
