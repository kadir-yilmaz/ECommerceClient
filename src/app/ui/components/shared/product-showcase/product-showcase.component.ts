import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { List_Product } from '../../../../contracts/list_product';
import { FavoriteService } from '../../../../services/common/models/favorite.service';

@Component({
  selector: 'app-product-showcase',
  templateUrl: './product-showcase.component.html',
  styleUrls: ['./product-showcase.component.scss']
})
export class ProductShowcaseComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() products: List_Product[] = [];
  @Input() viewAllRoute: string | any[] = '/products';
  @Input() viewAllParams: any = {};
  @Input() baseUrl: string = '';

  @Output() addToCart = new EventEmitter<List_Product>();
  @Output() toggleFavorite = new EventEmitter<List_Product>();

  @ViewChild('productsScroll', { static: false }) productsScroll: ElementRef;

  constructor(private favoriteService: FavoriteService) {}

  scroll(direction: 'left' | 'right') {
    if (this.productsScroll) {
      const container = this.productsScroll.nativeElement;
      const scrollAmount = 350;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }

  isProductFavorite(productId: string): boolean {
    return this.favoriteService.isFavorite(productId);
  }

  onAddToCart(product: List_Product) {
    this.addToCart.emit(product);
  }

  onToggleFavorite(product: List_Product) {
    this.toggleFavorite.emit(product);
  }
}
