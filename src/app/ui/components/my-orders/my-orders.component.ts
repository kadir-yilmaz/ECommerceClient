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
      this.orders = data.orders;
    } catch (error) {
      console.error("Orders load error:", error);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

}
