import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { BaseUrl } from '../../../../contracts/base_url';
import { Create_Basket_Item } from '../../../../contracts/basket/create_basket_item';
import { List_Product } from '../../../../contracts/list_product';
import { List_Product_Image } from '../../../../contracts/list_product_image';
import { ProductReview, ReviewListResponse, CanReviewResponse, UserReviewResponse } from '../../../../contracts/review/review';
import { AuthService } from '../../../../services/common/auth.service';
import { BasketService } from '../../../../services/common/models/basket.service';
import { FavoriteService } from '../../../../services/common/models/favorite.service';
import { FileService } from '../../../../services/common/models/file.service';
import { ProductService } from '../../../../services/common/models/product.service';
import { ReviewService } from '../../../../services/common/models/review.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent extends BaseComponent implements OnInit {
  baseUrl: BaseUrl;
  product: List_Product;
  selectedImagePath: string;
  isLightboxOpen: boolean = false;
  activeTab: string = 'description';

  // Review state
  reviews: ProductReview[] = [];
  reviewTotalCount: number = 0;
  reviewAverageRating: number = 0;
  ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewPage: number = 0;
  reviewPageSize: number = 5;
  canReview: boolean = false;
  canReviewReason: string = '';
  userReview: ProductReview | null = null;
  hasUserReview: boolean = false;

  // Review form state
  newRating: number = 0;
  newComment: string = '';
  hoverRating: number = 0;
  isEditMode: boolean = false;
  isSubmittingReview: boolean = false;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    } else if (event.key === 'Escape' && this.isLightboxOpen) {
      this.closeLightbox();
    }
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    if (tabName === 'reviews' && this.reviews.length === 0 && this.product) {
      this.loadReviews();
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private fileService: FileService,
    private basketService: BasketService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private router: Router,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    this.baseUrl = await this.fileService.getBaseStorageUrl();

    this.activatedRoute.params.subscribe(async (params) => {
      const productId = params["id"];
      try {
        this.product = await this.productService.readById(productId, () => { }, () => { });
        if (this.product) {
          const images: List_Product_Image[] = await this.productService.readImages(productId, () => { });
          this.product.productImageFiles = images;
          this.selectedImagePath = this.getShowcaseImagePath();

          // Load reviews
          await this.loadReviews();
          this.checkCanReview();
          this.loadUserReview();
        } else {
          throw new Error("Product null");
        }
      } catch (error) {
        this.customToastrService.message("Ürün bulunamadı.", "Hata", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
        this.router.navigate(["/"]);
      } finally {
        this.hideSpinner(SpinnerType.BallAtom);
      }
    });
  }

  async loadReviews(): Promise<void> {
    if (!this.product) return;
    try {
      const response: ReviewListResponse = await this.reviewService.getProductReviews(this.product.id, this.reviewPage, this.reviewPageSize);
      if (this.reviewPage === 0) {
        this.reviews = response.reviews;
      } else {
        this.reviews = [...this.reviews, ...response.reviews];
      }
      this.reviewTotalCount = response.totalCount;
      this.reviewAverageRating = response.averageRating;
      this.ratingDistribution = response.ratingDistribution;
    } catch (e) {
      console.error('Reviews load error:', e);
    }
  }

  async loadMoreReviews(): Promise<void> {
    this.reviewPage++;
    await this.loadReviews();
  }

  get hasMoreReviews(): boolean {
    return this.reviews.length < this.reviewTotalCount;
  }

  async checkCanReview(): Promise<void> {
    if (!this.authService.isAuthenticated || !this.product) return;
    try {
      const response: CanReviewResponse = await this.reviewService.canUserReview(this.product.id);
      this.canReview = response.canReview;
      this.canReviewReason = response.reason || '';
    } catch (e) {
      this.canReview = false;
    }
  }

  async loadUserReview(): Promise<void> {
    if (!this.authService.isAuthenticated || !this.product) return;
    try {
      const response: UserReviewResponse = await this.reviewService.getUserReview(this.product.id);
      this.hasUserReview = response.hasReview;
      this.userReview = response.review || null;
    } catch (e) {
      // silent
    }
  }

  setRating(rating: number): void {
    this.newRating = rating;
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  startEditReview(): void {
    if (this.userReview) {
      this.isEditMode = true;
      this.newRating = this.userReview.rating;
      this.newComment = this.userReview.comment;
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.newRating = 0;
    this.newComment = '';
  }

  async submitReview(): Promise<void> {
    if (this.newRating === 0 || !this.newComment.trim()) {
      this.customToastrService.message("Lütfen puan ve yorum giriniz.", "Eksik Bilgi", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.isSubmittingReview = true;
    try {
      if (this.isEditMode && this.userReview) {
        await this.reviewService.updateReview(this.userReview.id, this.newRating, this.newComment.trim());
        this.customToastrService.message("Yorumunuz güncellendi. Onay sürecine alındı.", "Yorum Güncellendi", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      } else {
        await this.reviewService.createReview(this.product.id, this.newRating, this.newComment.trim());
        this.customToastrService.message("Yorumunuz başarıyla gönderildi. Onay sürecine alındı.", "Yorum Gönderildi", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      }

      // Reset form and reload
      this.isEditMode = false;
      this.newRating = 0;
      this.newComment = '';
      this.reviewPage = 0;
      await this.loadReviews();
      await this.loadUserReview();
      await this.checkCanReview();
    } catch (error: any) {
      const msg = error?.error?.message || error?.message || "Yorum gönderilirken bir hata oluştu.";
      this.customToastrService.message(msg, "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.isSubmittingReview = false;
    }
  }

  async deleteReview(): Promise<void> {
    if (!this.userReview) return;
    try {
      await this.reviewService.deleteReview(this.userReview.id);
      this.customToastrService.message("Yorumunuz silindi.", "Yorum Silindi", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
      this.userReview = null;
      this.hasUserReview = false;
      this.reviewPage = 0;
      await this.loadReviews();
      await this.checkCanReview();
    } catch (error) {
      this.customToastrService.message("Yorum silinirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    }
  }

  async reactToReview(reviewId: string, isLike: boolean): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.customToastrService.message("Yorumları değerlendirmek için giriş yapmalısınız.", "Giriş Gerekli", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    try {
      const response = await this.reviewService.toggleReaction(reviewId, isLike);
      if (response && response.success) {
        // Find review in local reviews array and update it
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
          review.likeCount = response.likeCount;
          review.dislikeCount = response.dislikeCount;
          review.currentUserReaction = response.currentUserReaction;
        }

        // Also if the current userReview is the one being reacted to, update it as well
        if (this.userReview && this.userReview.id === reviewId) {
          this.userReview.likeCount = response.likeCount;
          this.userReview.dislikeCount = response.dislikeCount;
          this.userReview.currentUserReaction = response.currentUserReaction;
        }
      }
    } catch (error) {
      this.customToastrService.message("Değerlendirme yapılırken bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    }
  }

  getStarArray(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) stars.push('full');
      else if (i - 0.5 <= rating) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  getRatingPercentage(star: number): number {
    if (this.reviewTotalCount === 0) return 0;
    return ((this.ratingDistribution[star] || 0) / this.reviewTotalCount) * 100;
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Onay Bekliyor';
      case 1: return 'Onaylandı';
      case 2: return 'Reddedildi';
      default: return '';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-approved';
      case 2: return 'status-rejected';
      default: return '';
    }
  }

  getProductImage(path: string): string {
    if (!path) {
      return "";
    }

    const normalizedPath = path.replace(/\\/g, "/");
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const sanitizedBaseUrl = (this.baseUrl?.url ?? "").replace(/\/+$/, "");
    if (normalizedPath.startsWith("/")) {
      return `${sanitizedBaseUrl}${normalizedPath}`;
    }

    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }

  getShowcaseImagePath(): string {
    const showcaseImage = this.product?.productImageFiles?.find(image => image.showcase);
    return showcaseImage?.path
      ?? this.product?.productImageFiles?.[0]?.path
      ?? this.product?.imagePath
      ?? "";
  }

  selectImage(path: string): void {
    this.selectedImagePath = path;
  }

  nextImage(): void {
    if (!this.product?.productImageFiles?.length) return;
    const currentIndex = this.product.productImageFiles.findIndex(img => img.path === this.selectedImagePath);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % this.product.productImageFiles.length;
    this.selectedImagePath = this.product.productImageFiles[nextIndex].path;
  }

  prevImage(): void {
    if (!this.product?.productImageFiles?.length) return;
    const currentIndex = this.product.productImageFiles.findIndex(img => img.path === this.selectedImagePath);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + this.product.productImageFiles.length) % this.product.productImageFiles.length;
    this.selectedImagePath = this.product.productImageFiles[prevIndex].path;
  }

  get originalPrice(): number {
    return this.product?.price ? this.product.price * 1.20 : 0;
  }

  get reviewCount(): number {
    return this.reviewTotalCount;
  }

  get rating(): number {
    return this.reviewAverageRating || 0;
  }

  get brandName(): string {
    if(!this.product) return '';
    return this.product.brand || '';
  }

  get soldCount(): string {
    if(!this.product) return '';
    const count = (this.product.name.length * 42) % 3000 + 500;
    return count > 1000 ? `${(count/1000).toFixed(1)}B+` : `${count}`;
  }


  async addToBasket(): Promise<void> {
    if (!this.product) {
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      const basketItem: Create_Basket_Item = new Create_Basket_Item();
      basketItem.productId = this.product.id;
      basketItem.quantity = 1;
      await this.basketService.add(basketItem);

      this.customToastrService.message("Urun sepete eklendi.", "Sepete Eklendi", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    } catch (error) {
      this.customToastrService.message("Urun sepete eklenirken bir hata olustu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async onToggleFavorite(): Promise<void> {
    if (!this.product) return;

    if (!this.authService.isAuthenticated) {
      this.customToastrService.message('Favorilere eklemek için giriş yapmalısınız.', 'Giriş Gerekli', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const isAdded = await this.favoriteService.toggle(this.product.id);
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

  get isFavorite(): boolean {
    return this.product ? this.favoriteService.isFavorite(this.product.id) : false;
  }

  openLightbox(): void {
    this.isLightboxOpen = true;
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
  }
}
