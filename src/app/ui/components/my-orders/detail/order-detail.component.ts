import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { OrderService } from '../../../../services/common/models/order.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent extends BaseComponent implements OnInit {

  order: any = null;

  constructor(
    spinner: NgxSpinnerService,
    private orderService: OrderService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      const id = params['id'];
      if (id) {
        await this.loadOrderDetail(id);
      }
    });
  }

  async loadOrderDetail(id: string): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.order = await this.orderService.getOrderById(id);
      console.log("Loaded order detail:", this.order);
    } catch (error) {
      console.error("Order detail load error:", error);
      this.router.navigate(['/orders']);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  getStepLevel(status: number): number {
    switch (status) {
      case 0:
      case 1:
        return 1; // Sipariş Alındı
      case 3:
        return 2; // Hazırlanıyor
      case 4:
        return 3; // Kargoda
      case 5:
        return 4; // Teslim Edildi
      case 2:
        return -1; // İptal
      default:
        return 1;
    }
  }

  isStepCompleted(status: number, stepIndex: number): boolean {
    const currentStep = this.getStepLevel(status);
    return currentStep > stepIndex;
  }

  isStepActive(status: number, stepIndex: number): boolean {
    const currentStep = this.getStepLevel(status);
    return currentStep === stepIndex;
  }
}
