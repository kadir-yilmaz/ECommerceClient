import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { BaseUrl } from '../../../../contracts/base_url';
import { Category } from '../../../../contracts/category';
import { Create_Basket_Item } from '../../../../contracts/basket/create_basket_item';
import { List_Product } from '../../../../contracts/list_product';
import { AuthService } from '../../../../services/common/auth.service';
import { BasketService } from '../../../../services/common/models/basket.service';
import { CategoryService } from '../../../../services/common/models/category.service';
import { FavoriteService } from '../../../../services/common/models/favorite.service';
import { FileService } from '../../../../services/common/models/file.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';
import { parseSlug, base62ToUuid, generateCategoryUrl } from '../../../../utils/slug-utils';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
    private fileService: FileService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router,
    spinner: NgxSpinnerService,
    private customToastrService: CustomToastrService
  ) {
    super(spinner);
  }

  currentPageNo: number = 1;
  totalProductCount: number = 0;
  totalPageCount: number = 0;
  pageSize: number = 12;
  pageList: number[] = [];
  baseUrl: BaseUrl;

  products: List_Product[] = [];

  // Filter/Sort state
  categories: Category[] = [];
  categoryTree: any[] = [];
  selectedCategoryId: string = '';
  selectedSortType: string = '';
  searchTerm: string = '';
  selectedBrand: string = '';
  selectedProductIds: string = '';
  sidebarOpen: boolean = false;

  sortOptions = [
    { value: '', label: 'Önerilen Sıralama' },
    { value: 'price_asc', label: 'En Düşük Fiyat' },
    { value: 'price_desc', label: 'En Yüksek Fiyat' },
    { value: 'newest', label: 'En Yeniler' },
    { value: 'bestseller', label: 'Çok Satanlar' }
  ];

  async ngOnInit() {
    this.baseUrl = await this.fileService.getBaseStorageUrl();

    // Load categories with auto-retry
    await this.loadCategories();

    this.activatedRoute.params.subscribe(async params => {
      const slug = params['slug'];
      if (slug) {
        const parsed = parseSlug(slug);
        if (parsed.type === 'category' && parsed.id) {
          this.selectedCategoryId = parsed.id;
        }
      }

      this.activatedRoute.queryParams.subscribe(async queryParams => {
        this.currentPageNo = parseInt(queryParams['page'] ?? params['pageNo'] ?? 1, 10);
        if (!slug) {
          const cat = queryParams['category'];
          this.selectedCategoryId = cat ? (cat.includes('-') ? cat : base62ToUuid(cat)) : '';
        }
        this.selectedSortType = queryParams['sort'] || '';
        this.searchTerm = queryParams['q'] || queryParams['search'] || '';
        this.selectedBrand = queryParams['brand'] || '';
        this.selectedProductIds = queryParams['productIds'] || '';

        await this.loadProducts();
      });
    });
  }

  async loadProducts() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const data: { totalProductCount: number, products: List_Product[] } = await this.productService.read(
        this.currentPageNo - 1,
        this.pageSize,
        this.selectedCategoryId || undefined,
        this.selectedSortType || undefined,
        this.searchTerm || undefined,
        undefined,
        () => { },
        () => { },
        this.selectedBrand || undefined,
        this.selectedProductIds || undefined
      );

      this.products = data.products.map<List_Product>(p => {
        const showcaseImage = p.productImageFiles?.find(img => img.showcase);
        const path = showcaseImage ? showcaseImage.path : (p.productImageFiles?.length ? p.productImageFiles[0].path : '');

        return {
          ...p,
          imagePath: path
        };
      });

      this.totalProductCount = data.totalProductCount;
      this.totalPageCount = Math.ceil(this.totalProductCount / this.pageSize);

      this.pageList = [];
      if (this.currentPageNo - 3 <= 0) {
        for (let i = 1; i <= Math.min(7, this.totalPageCount); i++) {
          this.pageList.push(i);
        }
      } else if (this.currentPageNo + 3 >= this.totalPageCount) {
        for (let i = Math.max(1, this.totalPageCount - 6); i <= this.totalPageCount; i++) {
          this.pageList.push(i);
        }
      } else {
        for (let i = this.currentPageNo - 3; i <= this.currentPageNo + 3; i++) {
          this.pageList.push(i);
        }
      }
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  buildTree(categories: Category[], parentId: string = null): any[] {
    const normalizeId = (id: string | null | undefined) => (id || '').toString().trim().toLowerCase();
    const normalizedParentId = normalizeId(parentId);
    return categories
      .filter(c => normalizeId(c.parentCategoryId || null) === normalizedParentId)
      .map(c => ({
        ...c,
        children: this.buildTree(categories, c.id),
        expanded: true
      }));
  }

  onCategorySelect(categoryId: string) {
    if (!categoryId) {
      this.selectedCategoryId = '';
      const queryParams: any = {};
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.searchTerm) queryParams.q = this.searchTerm;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      this.router.navigate(['/products', 1], { queryParams });
    } else {
      const cat = this.categories.find(c => (c.id || '').toLowerCase() === categoryId.toLowerCase());
      const catUrl = generateCategoryUrl(cat || { id: categoryId });
      this.selectedCategoryId = categoryId;
      const queryParams: any = {};
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      this.router.navigate([catUrl], { queryParams });
    }
  }

  isParentOfSelected(node: any): boolean {
    if (!this.selectedCategoryId || !node || !node.children) return false;
    const normalizeId = (id: string | null | undefined) => (id || '').toString().trim().toLowerCase();
    const selected = normalizeId(this.selectedCategoryId);
    
    // Check if any direct child is selected
    if (node.children.some((c: any) => normalizeId(c.id) === selected)) {
      return true;
    }
    
    // Check recursively
    for (const child of node.children) {
      if (this.isParentOfSelected(child)) {
        return true;
      }
    }
    
    return false;
  }

  onSortChange(sortType: string) {
    this.selectedSortType = sortType;
    this.navigateWithFilters();
  }

  clearFilters() {
    this.selectedCategoryId = '';
    this.selectedSortType = '';
    this.searchTerm = '';
    this.selectedBrand = '';
    this.selectedProductIds = '';
    this.router.navigate(['/products', 1]);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPageCount || page === this.currentPageNo) return;
    const currentUrl = this.router.url.split('?')[0];

    if (currentUrl.startsWith('/products') && !currentUrl.includes('-c-')) {
      const queryParams: any = {};
      if (this.selectedCategoryId) queryParams.category = this.selectedCategoryId;
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.searchTerm) queryParams.search = this.searchTerm;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      if (this.selectedProductIds) queryParams.productIds = this.selectedProductIds;
      this.router.navigate(['/products', page], { queryParams });
    } else {
      const queryParams: any = {};
      if (page > 1) queryParams.page = page;
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.searchTerm) queryParams.q = this.searchTerm;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      this.router.navigate([currentUrl], { queryParams });
    }
  }

  private navigateWithFilters() {
    const currentUrl = this.router.url.split('?')[0];
    const queryParams: any = {};

    if (currentUrl.startsWith('/ara')) {
      if (this.searchTerm) queryParams.q = this.searchTerm;
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      this.router.navigate(['/ara'], { queryParams });
      return;
    }

    if (currentUrl.includes('-c-')) {
      if (this.selectedSortType) queryParams.sort = this.selectedSortType;
      if (this.selectedBrand) queryParams.brand = this.selectedBrand;
      this.router.navigate([currentUrl], { queryParams });
      return;
    }

    if (this.selectedCategoryId) queryParams.category = this.selectedCategoryId;
    if (this.selectedSortType) queryParams.sort = this.selectedSortType;
    if (this.searchTerm) queryParams.q = this.searchTerm;
    if (this.selectedBrand) queryParams.brand = this.selectedBrand;
    if (this.selectedProductIds) queryParams.productIds = this.selectedProductIds;

    this.router.navigate(['/products', 1], { queryParams });
  }

  getCategoryName(id: string): string {
    const cat = this.categories.find(c => (c.id || '').toLowerCase() === (id || '').toLowerCase());
    return cat ? cat.name : '';
  }

  get hasActiveFilters(): boolean {
    return !!this.selectedCategoryId || !!this.selectedSortType || !!this.searchTerm || !!this.selectedBrand || !!this.selectedProductIds;
  }

  async addToBasket(product: List_Product) {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = product.id;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.customToastrService.message('Urun sepete eklendi.', 'Sepete Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async onToggleFavorite(product: List_Product) {
    if (!this.authService.isAuthenticated) {
      this.customToastrService.message('Favorilere eklemek için giriş yapmalısınız.', 'Giriş Gerekli', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const isAdded = await this.favoriteService.toggle(product.id);
    if (isAdded) {
      this.customToastrService.message('Ürün favorilere eklendi.', 'Favorilere Eklendi', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } else {
      this.customToastrService.message('Ürün favorilerden çıkarıldı.', 'Favorilerden Çıkarıldı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
    }
  }

  isProductFavorite(productId: string): boolean {
    return this.favoriteService.isFavorite(productId);
  }

  private categoryLoadRetries: number = 0;
  private readonly maxCategoryRetries: number = 10;

  async loadCategories() {
    try {
      const catResult = await this.categoryService.getAll();
      if (catResult && catResult.categories && catResult.categories.length > 0) {
        this.categories = catResult.categories;
        this.categoryTree = this.buildTree(this.categories);
        this.categoryLoadRetries = 0;
      } else {
        this.retryLoadCategories();
      }
    } catch {
      this.retryLoadCategories();
    }
  }

  private retryLoadCategories() {
    if (this.categoryLoadRetries < this.maxCategoryRetries) {
      this.categoryLoadRetries++;
      const delay = this.categoryLoadRetries * 2000;
      setTimeout(async () => {
        await this.loadCategories();
      }, delay);
    }
  }
}
