import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { DiscountCouponService } from 'src/app/services/common/models/discount-coupon.service';
import { DiscountCoupon } from 'src/app/contracts/discount-coupon/discount-coupon';

@Component({
  selector: 'app-my-coupons',
  templateUrl: './my-coupons.component.html',
  styleUrls: ['./my-coupons.component.scss']
})
export class MyCouponsComponent extends BaseComponent implements OnInit {

  myCoupons: DiscountCoupon[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private discountCouponService: DiscountCouponService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.myCoupons = await this.discountCouponService.getMyCoupons();
    } catch (error) {
      console.error('Error loading my coupons:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

}
