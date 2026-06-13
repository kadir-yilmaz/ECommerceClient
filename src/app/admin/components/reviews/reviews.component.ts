import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { AdminReview, AdminReviewListResponse } from 'src/app/contracts/review/review';
import { ReviewService } from 'src/app/services/common/models/review.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent extends BaseComponent implements OnInit {
  reviews: AdminReview[] = [];
  totalCount: number = 0;
  page: number = 0;
  pageSize: number = 20;
  selectedStatus: number | null = null;

  // Profanity highlight words
  private profanityWords = [
    'amk', 'aq', 'amına', 'amina', 'sikeyim', 'sikerim', 'siktir', 'piç', 'pic',
    'orospu', 'oç', 'oc', 'pezevenk', 'gavat', 'ibne', 'göt', 'got',
    'yarrak', 'yarak', 'taşak', 'tasak', 'sikmek', 'sikik',
    'dangalak', 'gerizekalı', 'gerizekali', 'salak', 'aptal',
    'şerefsiz', 'serefsiz', 'namussuz', 'kaltak', 'kahpe',
    'amcık', 'amcik', 'dalyarak', 'yavşak', 'yavsak',
    'boktan', 'hassiktir'
  ];

  private pricePatterns = [
    /\d+[\.,]?\d*\s*(tl|₺|lira|kuruş|kurus|\$|€|dolar|euro)/gi,
    /[₺\$€]\s*\d+[\.,]?\d*/g,
    /\d+\s*(bin|milyon)?\s*(tl|lira)/gi
  ];

  private priceKeywords = ['fiyat', 'ücret', 'ucret', 'maliyet', 'pahalı', 'pahali', 'ucuz', 'indirim'];

  constructor(
    private reviewService: ReviewService,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    await this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const response: AdminReviewListResponse = await this.reviewService.getAllReviewsForAdmin(
        this.page, this.pageSize, this.selectedStatus ?? undefined
      );
      this.reviews = response.reviews;
      this.totalCount = response.totalCount;
    } catch (e) {
      this.customToastrService.message("Yorumlar yüklenemedi.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async filterByStatus(status: number | null): Promise<void> {
    this.selectedStatus = status;
    this.page = 0;
    await this.loadReviews();
  }

  async nextPage(): Promise<void> {
    if ((this.page + 1) * this.pageSize < this.totalCount) {
      this.page++;
      await this.loadReviews();
    }
  }

  async prevPage(): Promise<void> {
    if (this.page > 0) {
      this.page--;
      await this.loadReviews();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  async approveReview(reviewId: string): Promise<void> {
    try {
      await this.reviewService.moderateReview(reviewId, 1);
      this.customToastrService.message("Yorum onaylandı.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadReviews();
    } catch (e) {
      this.customToastrService.message("Hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  async rejectReview(reviewId: string): Promise<void> {
    try {
      await this.reviewService.moderateReview(reviewId, 2, 'İçerik politikalarına uygun değil.');
      this.customToastrService.message("Yorum reddedildi.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadReviews();
    } catch (e) {
      this.customToastrService.message("Hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Bekliyor';
      case 1: return 'Onaylı';
      case 2: return 'Reddedildi';
      default: return '';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'badge-warning';
      case 1: return 'badge-success';
      case 2: return 'badge-danger';
      default: return '';
    }
  }

  isFlagged(review: AdminReview): boolean {
    return review.hasProfanity || review.hasPriceInfo;
  }

  highlightComment(comment: string, review: AdminReview): string {
    if (!comment) return '';
    let result = this.escapeHtml(comment);

    if (review.hasProfanity) {
      for (const word of this.profanityWords) {
        const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
        result = result.replace(regex, '<span class="highlight-profanity">$1</span>');
      }
    }

    if (review.hasPriceInfo) {
      // Highlight price keywords
      for (const keyword of this.priceKeywords) {
        const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
        result = result.replace(regex, '<span class="highlight-price">$1</span>');
      }
      // Highlight price patterns (numbers with currency)
      result = result.replace(/(\d+[\.,]?\d*\s*(tl|₺|lira|kuruş|kurus|\$|€|dolar|euro))/gi,
        '<span class="highlight-price">$1</span>');
      result = result.replace(/([₺\$€]\s*\d+[\.,]?\d*)/g,
        '<span class="highlight-price">$1</span>');
    }

    return result;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getStarArray(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }
}
