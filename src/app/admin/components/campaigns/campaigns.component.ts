import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Campaign, Create_Campaign, Update_Campaign } from 'src/app/contracts/campaign/campaign';
import { CampaignService } from 'src/app/services/common/models/campaign.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base.component';

import { ProductService } from 'src/app/services/common/models/product.service';
import { List_Product } from 'src/app/contracts/list_product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Category } from 'src/app/contracts/category';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {

  campaigns: Campaign[] = [];
  products: List_Product[] = [];
  filteredProducts: List_Product[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  brands: string[] = [];
  filteredBrands: string[] = [];
  dataSource: MatTableDataSource<Campaign> = new MatTableDataSource<Campaign>();
  displayedColumns: string[] = ['name', 'ruleType', 'summary', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  showForm: boolean = false;
  campaignForm: FormGroup;
  isEditMode: boolean = false;
  editingCampaignId: string | null = null;
  formSubmitted: boolean = false;

  ruleTypes = [
    { value: 'TotalAmountDiscount', label: 'Sepet Tutarı İndirimi' },
    { value: 'FreeItem', label: 'Bedava Ürün (X Al Y Öde)' },
    { value: 'CheapestItemDiscount', label: 'En Ucuz Ürüne İndirim' },
    { value: 'BrandDiscount', label: 'Markaya Özel İndirim' },
    { value: 'CategoryDiscount', label: 'Komple Kategoriye Yüzdelik İndirim' },
    { value: 'SelectedProductsDiscount', label: 'Seçili Ürünlere İndirim' }
  ];

  constructor(
    private campaignService: CampaignService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService,
    private http: HttpClient
  ) { }

  async ngOnInit(): Promise<void> {
    this.createForm();
    await this.loadProducts();
    await this.loadCategories();
    await this.loadBrands();
    await this.loadCampaigns();

    // Filtreleme mantığı (Ürünler)
    this.campaignForm.get('productSearch')?.valueChanges.subscribe(val => {
      this.filterProducts(val);
    });

    // Filtreleme mantığı (Kategoriler)
    this.campaignForm.get('categorySearch')?.valueChanges.subscribe(val => {
      this.filterCategories(val);
    });

    // Filtreleme mantığı (Markalar)
    this.campaignForm.get('brandSearch')?.valueChanges.subscribe(val => {
      this.filterBrands(val);
    });
  }

  async loadBrands() {
    return new Promise<void>((resolve) => {
      this.http.get<string[]>('assets/brands.json').subscribe({
        next: (data) => {
          this.brands = data || [];
          this.filteredBrands = [...this.brands];
          resolve();
        },
        error: (err) => {
          console.error('Markalar yüklenemedi', err);
          resolve();
        }
      });
    });
  }

  filterBrands(searchQuery: string) {
    if (!searchQuery) {
      this.filteredBrands = [...this.brands];
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    this.filteredBrands = this.brands.filter(b => b.toLowerCase().includes(lowerCaseQuery));
  }

  async loadProducts() {
    try {
      const data = await this.productService.read(0, 1000, undefined, undefined, undefined, undefined, () => {}, () => {});
      this.products = data.products;
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Ürünler yüklenemedi', error);
    }
  }

  async loadCategories() {
    try {
      const data = await this.categoryService.getAll();
      this.categories = data.categories;
      this.filteredCategories = [...this.categories];
    } catch (error) {
      console.error('Kategoriler yüklenemedi', error);
    }
  }

  filterProducts(searchQuery: string) {
    if (!searchQuery) {
      this.filteredProducts = [...this.products];
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      p.name.toLowerCase().includes(lowerCaseQuery) || 
      (p.brand && p.brand.toLowerCase().includes(lowerCaseQuery))
    );
  }

  filterCategories(searchQuery: string) {
    if (!searchQuery) {
      this.filteredCategories = [...this.categories];
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    this.filteredCategories = this.categories.filter(c => c.name.toLowerCase().includes(lowerCaseQuery));
  }

  createForm() {
    this.campaignForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      ruleType: ['', Validators.required],
      minAmount: [null],
      discountRate: [null],
      minQuantity: [null],
      freeQuantity: [null],
      productId: [''],
      productSearch: [''],
      categoryId: [''],
      categorySearch: [''],
      brand: [''],
      brandSearch: [''],
      endDate: [null],
      isActive: [true]
    });

    // RuleType değiştiğinde dinamik validatorleri güncelle
    this.campaignForm.get('ruleType')?.valueChanges.subscribe(val => {
      this.updateConditionalValidators(val);
    });
  }

  /**
   * RuleType'a göre koşullu alanların validatorlerini dinamik olarak ekle/kaldır.
   * Nullable alanlar sadece ilgili RuleType seçildiğinde zorunlu olur.
   */
  updateConditionalValidators(ruleType: string) {
    const minAmount = this.campaignForm.get('minAmount');
    const discountRate = this.campaignForm.get('discountRate');
    const minQuantity = this.campaignForm.get('minQuantity');
    const freeQuantity = this.campaignForm.get('freeQuantity');
    const productId = this.campaignForm.get('productId');
    const categoryId = this.campaignForm.get('categoryId');
    const brand = this.campaignForm.get('brand');

    // Tüm koşullu alanların validatorlerini temizle
    [minAmount, discountRate, minQuantity, freeQuantity, productId, categoryId, brand].forEach(ctrl => {
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });

    switch (ruleType) {
      case 'TotalAmountDiscount':
        minAmount?.setValidators([Validators.required, Validators.min(1)]);
        discountRate?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        break;

      case 'FreeItem':
        productId?.setValidators([Validators.required]);
        minQuantity?.setValidators([Validators.required, Validators.min(2)]);
        freeQuantity?.setValidators([Validators.required, Validators.min(1)]);
        break;

      case 'CheapestItemDiscount':
        categoryId?.setValidators([Validators.required]);
        minQuantity?.setValidators([Validators.required, Validators.min(2)]);
        discountRate?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        break;

      case 'BrandDiscount':
        brand?.setValidators([Validators.required]);
        discountRate?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        break;

      case 'CategoryDiscount':
        categoryId?.setValidators([Validators.required]);
        discountRate?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        break;

      case 'SelectedProductsDiscount':
        productId?.setValidators([Validators.required]);
        discountRate?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        break;
    }

    // Güncellenmiş validatorleri uygula
    [minAmount, discountRate, minQuantity, freeQuantity, productId, categoryId, brand].forEach(ctrl => {
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  formatDateForInput(dateStr: string | Date | undefined | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    // Adjust for timezone offset to match local time for type="datetime-local"
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  }

  isExpired(campaign: Campaign): boolean {
    if (!campaign.endDate) return false;
    return new Date(campaign.endDate) < new Date();
  }

  async loadCampaigns() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      const allCampaigns = await this.campaignService.getAllCampaigns();
      
      // Tabloda kargo hariç diğerlerini göster
      this.campaigns = allCampaigns.filter(c => c.ruleType !== 'FreeShipping');
      this.dataSource = new MatTableDataSource<Campaign>(this.campaigns);
      this.dataSource.paginator = this.paginator;
    } catch (error) {
      this.toastrService.message("Kampanyalar yüklenirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  getRuleSummary(campaign: Campaign): string {
    if (campaign.ruleType === 'TotalAmountDiscount') {
      return `${campaign.minAmount || 0} TL ve üzeri sepete %${campaign.discountRate || 0} indirim`;
    } 
    
    if (campaign.ruleType === 'FreeItem') {
      const product = this.products.find(p => p.id === campaign.productId);
      const productName = product ? product.name : 'Bilinmeyen Ürün';
      return `Ürün: ${productName} (Al: ${campaign.minQuantity || 0}, Bedava: ${campaign.freeQuantity || 0})`;
    }

    if (campaign.ruleType === 'CheapestItemDiscount') {
      const category = this.categories.find(c => c.id === campaign.categoryId);
      const categoryName = category ? category.name : 'Bilinmeyen Kategori';
      const actionText = campaign.discountRate === 100 ? 'bedava' : `%${campaign.discountRate || 0} indirim`;
      return `Kategori: ${categoryName} (En az ${campaign.minQuantity || 0} adet alana en ucuzu ${actionText})`;
    }

    if (campaign.ruleType === 'BrandDiscount') {
      return `Marka: ${campaign.brand} (Sepette %${campaign.discountRate || 0} indirim)`;
    }

    if (campaign.ruleType === 'CategoryDiscount') {
      const category = this.categories.find(c => c.id === campaign.categoryId);
      const categoryName = category ? category.name : 'Bilinmeyen Kategori';
      return `Kategori: ${categoryName} (Sepette %${campaign.discountRate || 0} indirim)`;
    }

    if (campaign.ruleType === 'SelectedProductsDiscount') {
      const productIds = campaign.productId ? campaign.productId.split(',') : [];
      return `Seçili Ürünler (${productIds.length} adet) (Sepette %${campaign.discountRate || 0} indirim)`;
    }

    return '-';
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingCampaignId = null;
    this.formSubmitted = false;
    this.campaignForm.reset({ isActive: true });
    this.showForm = true;
  }

  openEditForm(campaign: Campaign) {
    this.isEditMode = true;
    this.editingCampaignId = campaign.id;
    this.formSubmitted = false;

    let prodValue: any = campaign.productId;
    if (campaign.ruleType === 'SelectedProductsDiscount') {
      prodValue = campaign.productId ? campaign.productId.split(',') : [];
    }

    this.campaignForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      ruleType: campaign.ruleType,
      minAmount: campaign.minAmount,
      discountRate: campaign.discountRate,
      minQuantity: campaign.minQuantity,
      freeQuantity: campaign.freeQuantity,
      productId: prodValue,
      categoryId: campaign.categoryId,
      brand: campaign.brand,
      endDate: campaign.endDate ? this.formatDateForInput(campaign.endDate) : null,
      isActive: campaign.isActive
    });
    // Dinamik validatorleri uygula
    this.updateConditionalValidators(campaign.ruleType);
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.formSubmitted = false;
    this.campaignForm.reset();
  }

  async submitForm() {
    this.formSubmitted = true;

    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      this.toastrService.message("Lütfen zorunlu alanları doldurun.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.spinner.show(SpinnerType.BallAtom);
    try {
      const formData = { ...this.campaignForm.value };
      if (formData.ruleType === 'SelectedProductsDiscount' && Array.isArray(formData.productId)) {
        formData.productId = formData.productId.join(',');
      } else if (Array.isArray(formData.productId)) {
        formData.productId = formData.productId[0] || '';
      }

      if (this.isEditMode && this.editingCampaignId) {
        const updateModel: Update_Campaign = {
          id: this.editingCampaignId,
          ...formData
        };
        await this.campaignService.updateCampaign(updateModel);
        this.toastrService.message("Kampanya güncellendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        const createModel: Create_Campaign = {
          ...formData
        };
        await this.campaignService.createCampaign(createModel);
        this.toastrService.message("Kampanya eklendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }

      this.showForm = false;
      this.formSubmitted = false;
      await this.loadCampaigns();
    } catch (error) {
      this.toastrService.message("Bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  async deleteCampaign(id: string) {
    if (confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) {
      this.spinner.show(SpinnerType.BallAtom);
      try {
        await this.campaignService.deleteCampaign(id);
        this.toastrService.message("Kampanya silindi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        await this.loadCampaigns();
      } catch (error) {
        this.toastrService.message("Silinirken hata oluştu.", "Hata", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      } finally {
        this.spinner.hide(SpinnerType.BallAtom);
      }
    }
  }
}
