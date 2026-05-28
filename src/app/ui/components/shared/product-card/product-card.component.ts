import { Component, EventEmitter, Input, OnChanges, OnInit, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { List_Product } from '../../../../contracts/list_product';
import { BasketService } from '../../../../services/common/models/basket.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnChanges, OnInit, OnDestroy {
  @Input() product: List_Product;
  @Input() baseUrl: string;
  @Input() badgeText: string = 'One Cikan';
  @Input() variant: 'default' | 'compact' = 'default';
  @Input() showAddToCart: boolean = true;
  @Input() isFavorite: boolean = false;

  @Output() addToCart = new EventEmitter<List_Product>();
  @Output() toggleFavorite = new EventEmitter<List_Product>();

  private readonly fallbackImage = '../../../../../assets/default-product.png';
  imageFailed = false;
  basketItems: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      this.imageFailed = false;
      this.checkInCart();
    }
  }

  activeImageIndex: number = 0;
  hoveringImage: boolean = false;

  get allImages(): string[] {
    const images: string[] = [];
    if (this.product?.productImageFiles && this.product.productImageFiles.length > 0) {
      this.product.productImageFiles.forEach(img => {
        if (img.path) images.push(this.getImageUrl(img.path));
      });
    } else if (this.product?.imagePath) {
      images.push(this.getImageUrl(this.product.imagePath));
    }
    
    if (images.length === 0) {
      images.push(this.fallbackImage);
    }
    return images;
  }

  getImageUrl(path: string): string {
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    const sanitizedBaseUrl = (this.baseUrl ?? '').replace(/\/+$/, '');
    if (!sanitizedBaseUrl) return normalizedPath;
    if (normalizedPath.startsWith('/')) return `${sanitizedBaseUrl}${normalizedPath}`;
    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }

  get currentImageSource(): string {
    if (this.imageFailed) return this.fallbackImage;
    const images = this.allImages;
    if (this.activeImageIndex >= 0 && this.activeImageIndex < images.length) {
      return images[this.activeImageIndex];
    }
    return images[0];
  }

  onImageMouseMove(event: MouseEvent): void {
    const images = this.allImages;
    if (images.length <= 1) return;

    this.hoveringImage = true;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const segmentWidth = width / images.length;
    
    let newIndex = Math.floor(x / segmentWidth);
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= images.length) newIndex = images.length - 1;
    this.activeImageIndex = newIndex;
  }

  onImageMouseEnter(): void {
    this.hoveringImage = true;
  }

  onImageMouseLeave(): void {
    this.hoveringImage = false;
    this.activeImageIndex = 0;
  }

  get stockLabel(): string {
    if (this.product?.stock > 100) return 'Hazir Stok';
    if (this.product?.stock > 0) return `${this.product.stock} adet kaldi`;
    return 'Stokta yok';
  }

  get availabilityTone(): 'available' | 'limited' | 'sold-out' {
    if (!this.product || this.product.stock <= 0) return 'sold-out';
    if (this.product.stock < 10) return 'limited';
    return 'available';
  }

  get originalPrice(): number {
    return this.product?.price ? this.product.price * 1.20 : 0;
  }

  get reviewCount(): number {
    if(!this.product) return 0;
    return (this.product.name.length * 87) % 15000 + 150;
  }

  get rating(): number {
    if(!this.product) return 0;
    return 4 + (this.product.name.length % 10) / 10;
  }

  get brandName(): string {
    if(!this.product || !this.product.name) return '';
    return this.product.name.split(' ')[0].toUpperCase();
  }

  get formattedProductName(): string {
    if(!this.product || !this.product.name) return '';
    const name = this.product.name;
    const brand = this.brandName;
    if (name.toUpperCase().startsWith(brand)) {
      return name.substring(brand.length).trim();
    }
    return name;
  }
  onImageError(): void {
    this.imageFailed = true;
  }

  inCart: boolean = false;
  private basketSub?: Subscription;

  constructor(private basketService: BasketService) {}

  ngOnInit() {
    this.basketSub = this.basketService.basketItems$.subscribe(items => {
      this.basketItems = items;
      this.checkInCart();
    });
  }

  checkInCart() {
    if (this.product && this.basketItems) {
      this.inCart = this.basketItems.some(item => item.name === this.product.name);
    }
  }

  ngOnDestroy() {
    this.basketSub?.unsubscribe();
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.inCart) {
      this.addToCart.emit(this.product);
    }
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggleFavorite.emit(this.product);
  }
}

