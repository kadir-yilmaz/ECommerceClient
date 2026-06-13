import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { ReviewService } from 'src/app/services/common/models/review.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { BaseUrl } from 'src/app/contracts/base_url';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss']
})
export class MyReviewsComponent extends BaseComponent implements OnInit {
  baseUrl: BaseUrl;

  activeMainTab: 'product' | 'order' = 'product';
  activeSubTab: 'unreviewed' | 'pending' | 'approved' | 'rejected' | 'deleted' = 'unreviewed';

  // Data lists
  unreviewedProducts: any[] = [];
  allReviews: any[] = [];

  // Computed sub-tab counts
  counts = {
    unreviewed: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0
  };

  // Modal State
  isModalOpen: boolean = false;
  activeProductId: string = '';
  activeProductName: string = '';
  activeProductBrand: string = '';
  activeProductImage: string = '';
  
  selectedRating: number = 0;
  hoverRating: number = 0;
  reviewComment: string = '';
  isEditMode: boolean = false;
  editingReviewId: string = '';
  isSubmittingReview: boolean = false;

  constructor(
    spinner: NgxSpinnerService,
    private reviewService: ReviewService,
    private fileService: FileService,
    private toastrService: CustomToastrService,
    private activatedRoute: ActivatedRoute
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      await this.loadAllData();

      this.activatedRoute.queryParams.subscribe(async params => {
        const productIdParam = params['productId'];
        if (productIdParam) {
          const foundProduct = this.unreviewedProducts.find(p => p.productId === productIdParam);
          if (foundProduct) {
            this.openReviewModal(foundProduct, false);
          } else {
            const foundReview = this.allReviews.find(r => r.productId === productIdParam && !r.isDeleted);
            if (foundReview) {
              this.openReviewModal(foundReview, true);
            }
          }
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async loadAllData(): Promise<void> {
    try {
      // 1. Get unreviewed products
      this.unreviewedProducts = await this.reviewService.getUnreviewedProducts();
      
      // 2. Get user reviews
      this.allReviews = await this.reviewService.getUserReviews();

      // Recalculate counts
      this.updateCounts();
    } catch (error) {
      this.toastrService.message("Değerlendirme bilgileri yüklenemedi.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  updateCounts(): void {
    this.counts.unreviewed = this.unreviewedProducts.length;
    this.counts.pending = this.allReviews.filter(r => r.status === 0 && !r.isDeleted).length;
    this.counts.approved = this.allReviews.filter(r => r.status === 1 && !r.isDeleted).length;
    this.counts.rejected = this.allReviews.filter(r => r.status === 2 && !r.isDeleted).length;
    this.counts.deleted = this.allReviews.filter(r => r.isDeleted).length;
  }

  get filteredReviews(): any[] {
    switch (this.activeSubTab) {
      case 'pending':
        return this.allReviews.filter(r => r.status === 0 && !r.isDeleted);
      case 'approved':
        return this.allReviews.filter(r => r.status === 1 && !r.isDeleted);
      case 'rejected':
        return this.allReviews.filter(r => r.status === 2 && !r.isDeleted);
      case 'deleted':
        return this.allReviews.filter(r => r.isDeleted);
      default:
        return [];
    }
  }

  getProductImageUrl(path: string): string {
    if (!path) return '../../../../../assets/default-product.png';
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    const base = (this.baseUrl?.url ?? '').replace(/\/+$/, '');
    if (normalizedPath.startsWith('/')) return `${base}${normalizedPath}`;
    return `${base}/${normalizedPath}`;
  }

  // Review management actions
  openReviewModal(item: any, isEdit: boolean = false): void {
    this.isModalOpen = true;
    this.isEditMode = isEdit;
    
    if (isEdit) {
      // item is a review object
      this.activeProductId = item.productId;
      this.activeProductName = item.productName;
      this.activeProductBrand = item.productBrand;
      this.activeProductImage = item.productImagePath;
      this.selectedRating = item.rating;
      this.reviewComment = item.comment;
      this.editingReviewId = item.id;
    } else {
      // item is an unreviewed product object
      this.activeProductId = item.productId;
      this.activeProductName = item.productName;
      this.activeProductBrand = item.productBrand;
      this.activeProductImage = item.productImagePath;
      this.selectedRating = 0;
      this.reviewComment = '';
      this.editingReviewId = '';
    }
  }

  closeReviewModal(): void {
    this.isModalOpen = false;
    this.activeProductId = '';
    this.activeProductName = '';
    this.activeProductBrand = '';
    this.activeProductImage = '';
    this.selectedRating = 0;
    this.hoverRating = 0;
    this.reviewComment = '';
    this.editingReviewId = '';
    this.isEditMode = false;
  }

  async submitReview(): Promise<void> {
    if (this.selectedRating === 0) {
      this.toastrService.message("Lütfen bir yıldız derecesi seçin.", "Eksik Bilgi", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    if (this.reviewComment.trim().length < 10) {
      this.toastrService.message("Yorumunuz en az 10 karakter olmalıdır.", "Eksik Bilgi", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.isSubmittingReview = true;
    this.showSpinner(SpinnerType.BallAtom);

    try {
      if (this.isEditMode) {
        await this.reviewService.updateReview(this.editingReviewId, this.selectedRating, this.reviewComment.trim());
        this.toastrService.message("Değerlendirmeniz başarıyla güncellendi. Onaylandıktan sonra yayına alınacaktır.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.reviewService.createReview(this.activeProductId, this.selectedRating, this.reviewComment.trim());
        this.toastrService.message("Değerlendirmeniz başarıyla gönderildi. Onaylandıktan sonra yayına alınacaktır.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }
      this.closeReviewModal();
      await this.loadAllData();
    } catch (error: any) {
      const msg = error.error?.message || "İşlem gerçekleştirilemedi.";
      this.toastrService.message(msg, "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.isSubmittingReview = false;
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.reviewService.deleteReview(reviewId);
      this.toastrService.message("Değerlendirmeniz silindi.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadAllData();
    } catch (e) {
      this.toastrService.message("Silme işlemi başarısız.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  getStarArray(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array.from({ length: 5 - rating }, (_, i) => i);
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
}
