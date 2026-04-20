import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { List_Product } from '../../../../contracts/list_product';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnChanges {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      this.imageFailed = false;
    }
  }

  get imageSource(): string {
    if (this.imageFailed || !this.product?.imagePath) {
      return this.fallbackImage;
    }

    const normalizedPath = this.product.imagePath.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const sanitizedBaseUrl = (this.baseUrl ?? '').replace(/\/+$/, '');
    if (!sanitizedBaseUrl) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/')) {
      return `${sanitizedBaseUrl}${normalizedPath}`;
    }

    return `${sanitizedBaseUrl}/${normalizedPath}`;
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

  onImageError(): void {
    this.imageFailed = true;
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isFavorite = !this.isFavorite;
    this.toggleFavorite.emit(this.product);
  }
}
