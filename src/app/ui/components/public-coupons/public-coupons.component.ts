import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { DiscountCoupon } from 'src/app/contracts/discount-coupon/discount-coupon';
import { DiscountCouponService } from 'src/app/services/common/models/discount-coupon.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-public-coupons',
  templateUrl: './public-coupons.component.html',
  styleUrls: ['./public-coupons.component.scss']
})
export class PublicCouponsComponent extends BaseComponent implements OnInit {
  publicCoupons: DiscountCoupon[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private discountCouponService: DiscountCouponService,
    private customToastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.publicCoupons = await this.discountCouponService.getPublicCoupons();
    } catch (error) {
      console.error('Error loading public coupons:', error);
      this.customToastrService.message('Kuponlar yüklenirken bir hata oluştu.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  copyCouponCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.customToastrService.message(`"${code}" kopyalandı!`, 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
    }).catch(() => {
      this.customToastrService.message('Kopyalama başarısız oldu.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    });
  }
}
