import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/common/auth.service';
import { BasketService } from './services/common/models/basket.service';
import { FavoriteService } from './services/common/models/favorite.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from './services/ui/custom-toastr.service';
import { CategoryService } from './services/common/models/category.service';
import { Category } from './contracts/category';
import { ProductService } from './services/common/models/product.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  isAdminPage: boolean = false;
  isAuthPage: boolean = false;
  private authSubscription?: Subscription;

  // Mega Menu State
  categories: Category[] = [];
  categoryTree: any[] = [];
  hoveredCategory: any = null;
  megaMenuOpen: boolean = false;

  // Search State
  searchQuery: string = '';
  searchSuggestions: any[] = [];
  showSearchSuggestions: boolean = false;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    public router: Router,
    public basketService: BasketService,
    public favoriteService: FavoriteService,
    private categoryService: CategoryService,
    private productService: ProductService
  ) {
    authService.identityCheck();
    basketService.get();

    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.isAdminPage = event.urlAfterRedirects.startsWith('/admin');
        this.isAuthPage = event.urlAfterRedirects.startsWith('/login') || event.urlAfterRedirects.startsWith('/register');
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Categories loading
    await this.loadCategories();

    // Reactive auth state değişikliklerini dinle
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      this.basketService.get();
      if (isAuth) {
        this.favoriteService.get();
      }
    });
  }

  private categoryLoadRetries: number = 0;
  private readonly maxCategoryRetries: number = 10;

  async loadCategories() {
    try {
      const res = await this.categoryService.getAll();
      if (res && res.categories && res.categories.length > 0) {
        this.categories = res.categories;
        this.categoryTree = this.buildTree(this.categories);
        this.categoryLoadRetries = 0; // Reset retries on success
      } else {
        this.retryLoadCategories();
      }
    } catch (e) {
      console.error('Error loading categories, scheduling retry...', e);
      this.retryLoadCategories();
    }
  }

  private retryLoadCategories() {
    if (this.categoryLoadRetries < this.maxCategoryRetries) {
      this.categoryLoadRetries++;
      // Retries: 2s, 4s, 6s...
      const delay = this.categoryLoadRetries * 2000;
      setTimeout(async () => {
        await this.loadCategories();
      }, delay);
    }
  }

  buildTree(categories: Category[], parentId: string = null): any[] {
    return categories
      .filter(c => (c.parentCategoryId || null) === parentId)
      .map(c => ({
        ...c,
        children: this.buildTree(categories, c.id),
        expanded: false
      }));
  }

  private hoverTimeout: any;

  onHoverCategory(category: any) {
    this.hoveredCategory = category;
  }

  onMegaMenuHover(open: boolean) {
    if (open) {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
      this.megaMenuOpen = true;
      if (this.categoryTree.length > 0 && !this.hoveredCategory) {
        this.hoveredCategory = this.categoryTree[0];
      }
    } else {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      this.hoverTimeout = setTimeout(() => {
        this.megaMenuOpen = false;
        this.hoveredCategory = null;
      }, 150); // 150ms debounce/delay to cross gaps or diagonal movement
    }
  }

  navigateToCategory(categoryId: string) {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.megaMenuOpen = false;
    this.hoveredCategory = null;
    this.router.navigate(['/products', 1], { queryParams: { category: categoryId } });
  }

  toggleMegaMenu() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.megaMenuOpen = !this.megaMenuOpen;
    if (this.megaMenuOpen && this.categoryTree.length > 0 && !this.hoveredCategory) {
      this.hoveredCategory = this.categoryTree[0];
    }
    if (!this.megaMenuOpen) {
      this.hoveredCategory = null;
    }
  }

  closeMegaMenu(event: Event) {
    event.stopPropagation();
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.megaMenuOpen = false;
    this.hoveredCategory = null;
  }

  onCategoryClick(cat: any, event: Event) {
    if (window.innerWidth < 992) {
      event.stopPropagation();
      this.hoveredCategory = cat;
    } else {
      this.navigateToCategory(cat.id);
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  signOut() {
    // Step 1: Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('guest_basket_id');
    
    // Step 2: Clear authentication state
    this.authService.clearAuthentication();
    
    // Step 3: Clear basket state
    this.basketService.clear();
    
    // Step 3b: Clear favorite state
    this.favoriteService.clear();
    
    // Step 4: Refresh basket for guest session
    this.basketService.get();
    
    // Step 5: Navigate to home
    this.router.navigate(['']);
    
    // Step 6: Show confirmation
    this.toastrService.message('Oturum kapatilmistir.', 'Oturum Kapatildi', {
      messageType: ToastrMessageType.Info,
      position: ToastrPosition.BottomRight
    });
  }

  async onSearchInput(event: any) {
    const val = event.target.value;
    this.searchQuery = val;
    if (val && val.trim().length >= 2) {
      try {
        this.searchSuggestions = await this.productService.getSearchSuggestions(val.trim());
        this.showSearchSuggestions = this.searchSuggestions.length > 0;
      } catch (err) {
        this.searchSuggestions = [];
      }
    } else {
      this.searchSuggestions = [];
      this.showSearchSuggestions = false;
    }
  }

  onSearchFocus() {
    if (this.searchSuggestions.length > 0) {
      this.showSearchSuggestions = true;
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSearchSuggestions = false;
    }, 200); // 200ms delay to allow clicking suggestions
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.text;
    this.showSearchSuggestions = false;
    this.searchSuggestions = [];

    if (suggestion.type === 'Ürün') {
      this.router.navigate(['/products/detail', suggestion.targetId]);
    } else if (suggestion.type === 'Kategori') {
      this.router.navigate(['/products', 1], { queryParams: { category: suggestion.targetId } });
    } else {
      // Marka or KategoriCombo
      this.router.navigate(['/products', 1], { queryParams: { search: suggestion.text } });
    }
  }

  onSearchSubmit() {
    if (this.searchQuery && this.searchQuery.trim()) {
      this.showSearchSuggestions = false;
      this.searchSuggestions = [];
      this.router.navigate(['/products', 1], { queryParams: { search: this.searchQuery.trim() } });
    }
  }
}

