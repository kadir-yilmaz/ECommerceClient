export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: number;
  hasProfanity: boolean;
  hasPriceInfo: boolean;
  adminNote?: string;
  createdDate: Date;
  updatedDate: Date;
  likeCount?: number;
  dislikeCount?: number;
  currentUserReaction?: string | null;
}

export interface ReviewListResponse {
  reviews: ProductReview[];
  totalCount: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

export interface UserReviewResponse {
  hasReview: boolean;
  review?: ProductReview;
}

export interface AdminReviewListResponse {
  reviews: AdminReview[];
  totalCount: number;
}

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  status: number;
  hasProfanity: boolean;
  hasPriceInfo: boolean;
  adminNote?: string;
  createdDate: Date;
  updatedDate: Date;
}
