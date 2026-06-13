import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { firstValueFrom } from 'rxjs';
import { ReviewListResponse, CanReviewResponse, UserReviewResponse, AdminReviewListResponse } from '../../../contracts/review/review';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  constructor(private httpClientService: HttpClientService) { }

  async getProductReviews(productId: string, page: number = 0, size: number = 10): Promise<ReviewListResponse> {
    const observable = this.httpClientService.get<ReviewListResponse>({
      controller: 'productreviews',
      action: productId,
      queryString: `page=${page}&size=${size}`
    });
    return await firstValueFrom(observable);
  }

  async canUserReview(productId: string): Promise<CanReviewResponse> {
    const observable = this.httpClientService.get<CanReviewResponse>({
      controller: 'productreviews',
      action: `can-review/${productId}`
    });
    return await firstValueFrom(observable);
  }

  async getUserReview(productId: string): Promise<UserReviewResponse> {
    const observable = this.httpClientService.get<UserReviewResponse>({
      controller: 'productreviews',
      action: `user/${productId}`
    });
    return await firstValueFrom(observable);
  }

  async createReview(productId: string, rating: number, comment: string): Promise<any> {
    const observable = this.httpClientService.post({
      controller: 'productreviews'
    }, { productId, rating, comment });
    return await firstValueFrom(observable);
  }

  async updateReview(reviewId: string, rating: number, comment: string): Promise<any> {
    const observable = this.httpClientService.put({
      controller: 'productreviews'
    }, { reviewId, rating, comment });
    return await firstValueFrom(observable);
  }

  async deleteReview(reviewId: string): Promise<any> {
    const observable = this.httpClientService.delete({
      controller: 'productreviews'
    }, reviewId);
    return await firstValueFrom(observable);
  }

  // Admin endpoints
  async getAllReviewsForAdmin(page: number = 0, size: number = 20, status?: number): Promise<AdminReviewListResponse> {
    let qs = `page=${page}&size=${size}`;
    if (status !== undefined && status !== null) qs += `&status=${status}`;

    const observable = this.httpClientService.get<AdminReviewListResponse>({
      controller: 'productreviews',
      action: 'admin/all',
      queryString: qs
    });
    return await firstValueFrom(observable);
  }

  async moderateReview(reviewId: string, status: number, adminNote?: string): Promise<any> {
    const observable = this.httpClientService.put({
      controller: 'productreviews',
      action: 'admin/moderate'
    }, { reviewId, status, adminNote });
    return await firstValueFrom(observable);
  }

  async getUserReviews(): Promise<any[]> {
    const observable = this.httpClientService.get<any[]>({
      controller: 'productreviews',
      action: 'my-reviews'
    });
    return await firstValueFrom(observable);
  }

  async getUnreviewedProducts(): Promise<any[]> {
    const observable = this.httpClientService.get<any[]>({
      controller: 'productreviews',
      action: 'unreviewed'
    });
    return await firstValueFrom(observable);
  }

  async toggleReaction(reviewId: string, isLike: boolean): Promise<any> {
    const observable = this.httpClientService.post<any>({
      controller: 'productreviews',
      action: 'react'
    }, { reviewId, isLike });
    return await firstValueFrom(observable);
  }
}
