import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  productForm: FormGroup;
  submitted = false;

  allCategories: Category[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];
  selectedMainCategoryId: string = '';
  selectedSubCategoryId: string = '';

  brands: string[] = [];
  filteredBrands: string[] = [];

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private alertify: AlertifyService,
    private router: Router,
    private http: HttpClient
  ) {
    super(spinner);
    this.createForm();
  }

  createForm() {
    this.productForm = this.fb.group({
      brand: [''],
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  // Getter'lar — template'te kolay erişim için
  get f() { return this.productForm.controls; }

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
    this.productForm.patchValue({ brand: event.option.value });
  }

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

  isCategorySelectionValid(): boolean {
    const finalCategoryId = this.selectedSubCategoryId || this.selectedMainCategoryId;
    if (!finalCategoryId) return false;
    return !this.allCategories.some(c => c.parentCategoryId === finalCategoryId);
  }

  create() {
    this.submitted = true;

    // Kategori zorunlu kontrolü (form dışında kontrol ediliyor çünkü iki dropdown'dan oluşuyor)
    if (!this.isCategorySelectionValid()) {
      const msg = !this.selectedMainCategoryId 
        ? "Lütfen bir kategori seçiniz!"
        : "Seçilen kategori alt kategorilere sahip olduğundan, ürün doğrudan bu kategoriye eklenemez. Lütfen bir alt kategori seçiniz.";
      
      this.alertify.message(msg, {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    }

    if (this.productForm.invalid || !this.isCategorySelectionValid()) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);

    const formValue = this.productForm.value;
    const createModel: any = {
      name: formValue.name,
      stock: formValue.stock,
      price: formValue.price,
      brand: formValue.brand
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

      // Yeni ürün eklendikten sonra doğrudan o ürünün düzenleme ekranına git
      // Böylece kullanıcı hemen "Vitrin" resmini seçebilir veya ek düzenlemeler yapabilir.
      this.router.navigate(['/admin/products/edit', productId]);
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
