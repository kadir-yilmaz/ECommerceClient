import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { DiscountCoupon, Create_DiscountCoupon, Update_DiscountCoupon } from 'src/app/contracts/discount-coupon/discount-coupon';

@Injectable({
  providedIn: 'root'
})
export class DiscountCouponService {

  constructor(private httpClientService: HttpClientService) { }

  async getAllDiscountCoupons(): Promise<DiscountCoupon[]> {
    const observable = this.httpClientService.get<{ coupons: DiscountCoupon[] }>({
      controller: 'discountcoupons'
    });

    const response = await firstValueFrom(observable);
    return response.coupons;
  }

  async createDiscountCoupon(coupon: Create_DiscountCoupon): Promise<void> {
    const observable = this.httpClientService.post({
      controller: 'discountcoupons'
    }, coupon);

    await firstValueFrom(observable);
  }

  async updateDiscountCoupon(coupon: Update_DiscountCoupon): Promise<void> {
    const observable = this.httpClientService.put({
      controller: 'discountcoupons'
    }, coupon);

    await firstValueFrom(observable);
  }

  async deleteDiscountCoupon(id: string): Promise<void> {
    const observable = this.httpClientService.delete({
      controller: 'discountcoupons'
    }, id);

    await firstValueFrom(observable);
  }

  async assignCouponToUsers(couponId: string, userIds: string[]): Promise<{success: boolean, message: string}> {
    const observable = this.httpClientService.post<any>({
      controller: 'discountcoupons',
      action: 'assign-to-users'
    }, { couponId, userIds });

    return await firstValueFrom(observable);
  }

  async getPublicCoupons(): Promise<DiscountCoupon[]> {
    const observable = this.httpClientService.get<{ coupons: DiscountCoupon[] }>({
      controller: 'discountcoupons',
      action: 'public'
    });

    const response = await firstValueFrom(observable);
    return response.coupons;
  }

  async getMyCoupons(): Promise<DiscountCoupon[]> {
    const observable = this.httpClientService.get<{ coupons: DiscountCoupon[] }>({
      controller: 'discountcoupons',
      action: 'my-coupons'
    });

    const response = await firstValueFrom(observable);
    return response.coupons;
  }
}
