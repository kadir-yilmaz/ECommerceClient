import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { OrderService } from '../../../services/common/models/order.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent extends BaseComponent implements OnInit {

  constructor(spinner: NgxSpinnerService, private orderService: OrderService) {
    super(spinner);
  }

  orders: any[] = [];

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const data = await this.orderService.getOrdersByUser(0, 50);
      this.orders = await this.completeMissingOrderItems(data.orders ?? []);
    } catch (error) {
      console.error("Orders load error:", error);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  // Stepper logic (0: Bekliyor, 1: Tamamlandı -> Step 1)
  // (3: Hazırlanıyor -> Step 2)
  // (4: Kargoda -> Step 3)
  // (5: Teslim Edildi -> Step 4)
  // 2: İptal edildi (bunun için ekstra step de eklenebilir ama standart flow 4 adım)

  private async completeMissingOrderItems(orders: any[]): Promise<any[]> {
    return await Promise.all(orders.map(async order => {
      if (order.orderItems?.length || !order.id) {
        return order;
      }

      try {
        const detail = await this.orderService.getOrderById(order.id);
        const basketItems = detail?.basketItems ?? [];

        return {
          ...order,
          orderItems: basketItems.map((item: any) => ({
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity
          }))
        };
      } catch (error) {
        console.error(`Order detail load error (${order.id}):`, error);
        return order;
      }
    }));
  }

  getStepLevel(status: number): number {
    switch (status) {
      case 0:
      case 1:
        return 1; // Sipariş Alındı (Ödeme onaylandı)
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
