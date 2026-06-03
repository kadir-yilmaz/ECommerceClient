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
}
