import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  dataSource: MatTableDataSource<Campaign> = new MatTableDataSource<Campaign>();
  displayedColumns: string[] = ['name', 'ruleType', 'summary', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  showForm: boolean = false;
  campaignForm: FormGroup;
  isEditMode: boolean = false;
  editingCampaignId: string | null = null;

  // Kargo Kuralı
  freeShippingCampaign: Campaign | null = null;
  shippingThreshold: number = 100;
  isShippingActive: boolean = true;

  ruleTypes = [
    { value: 'TotalAmountDiscount', label: 'Sepet Tutarı İndirimi' },
    { value: 'FreeItem', label: 'Bedava Ürün (X Al Y Öde)' },
    { value: 'CheapestItemDiscount', label: 'En Ucuz Ürüne İndirim' }
  ];

  constructor(
    private campaignService: CampaignService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.createForm();
    await this.loadProducts();
    await this.loadCategories();
    await this.loadCampaigns();

    // Filtreleme mantığı (Ürünler)
    this.campaignForm.get('productSearch')?.valueChanges.subscribe(val => {
      this.filterProducts(val);
    });

    // Filtreleme mantığı (Kategoriler)
    this.campaignForm.get('categorySearch')?.valueChanges.subscribe(val => {
      this.filterCategories(val);
    });
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
    this.filteredProducts = this.products.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
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
      name: ['', Validators.required],
      description: ['', Validators.required],
      ruleType: ['', Validators.required],
      minAmount: [null],
      discountRate: [null],
      minQuantity: [null],
      freeQuantity: [null],
      productId: [''],
      productSearch: [''],
      categoryId: [''],
      categorySearch: [''],
      isActive: [true]
    });

    this.campaignForm.get('ruleType')?.valueChanges.subscribe(val => {
      // Logic to reset validators based on ruletype if needed
    });
  }

  async loadCampaigns() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      const allCampaigns = await this.campaignService.getAllCampaigns();
      
      // Kargo kampanyasını ayır
      this.freeShippingCampaign = allCampaigns.find(c => c.ruleType === 'FreeShipping') || null;
      if (this.freeShippingCampaign) {
        this.shippingThreshold = this.freeShippingCampaign.minAmount || 100;
        this.isShippingActive = this.freeShippingCampaign.isActive;
      } else {
        this.shippingThreshold = 100;
        this.isShippingActive = true;
      }

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

    return '-';
  }

  async saveShippingRule() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      if (this.freeShippingCampaign) {
        // Güncelle
        const updateModel: Update_Campaign = {
          id: this.freeShippingCampaign.id,
          name: 'Kargo Bedava',
          description: `${this.shippingThreshold} TL ve üzeri alışverişlerde kargo bedava!`,
          ruleType: 'FreeShipping',
          minAmount: this.shippingThreshold,
          isActive: this.isShippingActive
        };
        await this.campaignService.updateCampaign(updateModel);
      } else {
        // Yeni Ekle
        const createModel: Create_Campaign = {
          name: 'Kargo Bedava',
          description: `${this.shippingThreshold} TL ve üzeri alışverişlerde kargo bedava!`,
          ruleType: 'FreeShipping',
          minAmount: this.shippingThreshold,
          isActive: this.isShippingActive
        };
        await this.campaignService.createCampaign(createModel);
      }
      this.toastrService.message("Kargo kuralı kaydedildi.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadCampaigns();
    } catch (error) {
      this.toastrService.message("Kargo kuralı kaydedilirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingCampaignId = null;
    this.campaignForm.reset({ isActive: true });
    this.showForm = true;
  }

  openEditForm(campaign: Campaign) {
    this.isEditMode = true;
    this.editingCampaignId = campaign.id;
    this.campaignForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      ruleType: campaign.ruleType,
      minAmount: campaign.minAmount,
      discountRate: campaign.discountRate,
      minQuantity: campaign.minQuantity,
      freeQuantity: campaign.freeQuantity,
      productId: campaign.productId,
      categoryId: campaign.categoryId,
      isActive: campaign.isActive
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.campaignForm.reset();
  }

  async submitForm() {
    if (this.campaignForm.invalid) {
      this.toastrService.message("Lütfen zorunlu alanları doldurun.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.spinner.show(SpinnerType.BallAtom);
    try {
      const formData = this.campaignForm.value;

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
