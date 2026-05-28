import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_Order } from '../../../../contracts/order/list_order';
import { OrderDetailDialogComponent, OrderDetailDialogState } from '../../../../dialogs/order-detail-dialog/order-detail-dialog.component';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { DialogService } from '../../../../services/common/dialog.service';
import { OrderService } from '../../../../services/common/models/order.service';

declare var $: any;

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {

  constructor(spinner: NgxSpinnerService,
    private orderService: OrderService,
    private alertifyService: AlertifyService,
    private dialogService: DialogService) {
    super(spinner)
  }


  displayedColumns: string[] = ['orderCode', 'userName', 'totalPrice', 'createdDate', 'status', 'actions', 'viewdetail', 'delete'];
  dataSource: MatTableDataSource<List_Order> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  // Kargo modal state
  shipOrderId: string = '';
  shipCargoCompany: string = '';
  shipTrackingNumber: string = '';

  async getOrders() {
    this.showSpinner(SpinnerType.BallAtom);

    const allOrders: { totalOrderCount: number; orders: List_Order[] } = await this.orderService.getAllOrders(this.paginator ? this.paginator.pageIndex : 0, this.paginator ? this.paginator.pageSize : 5, () => this.hideSpinner(SpinnerType.BallAtom), (errorMessage: any) => {
      this.alertifyService.message(errorMessage.message, {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    })
    this.dataSource = new MatTableDataSource<List_Order>(allOrders.orders);
    this.paginator.length = allOrders.totalOrderCount;
  }

  async pageChanged() {
    await this.getOrders();
  }

  async ngOnInit() {
    await this.getOrders();
  }

  showDetail(id: string) {
    this.dialogService.openDialog({
      componentType: OrderDetailDialogComponent,
      data: id,
      options: {
        width: "750px"
      },
      afterClosed: () => {
        this.getOrders();
      }
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Beklemede';
      case 1: return 'Ödeme Tamamlandı';
      case 2: return 'Başarısız';
      case 3: return 'Hazırlanıyor';
      case 4: return 'Kargoda';
      case 5: return 'Teslim Edildi';
      default: return 'Bilinmiyor';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-completed';
      case 2: return 'status-failed';
      case 3: return 'status-processing';
      case 4: return 'status-shipped';
      case 5: return 'status-delivered';
      default: return '';
    }
  }

  getStatusIcon(status: number): string {
    switch (status) {
      case 0: return 'schedule';
      case 1: return 'check_circle';
      case 2: return 'cancel';
      case 3: return 'settings';
      case 4: return 'local_shipping';
      case 5: return 'inventory_2';
      default: return 'help';
    }
  }

  async updateStatus(orderId: string, status: number) {
    try {
      await this.orderService.updateOrderStatus(orderId, status);
      this.alertifyService.message(`Sipariş durumu güncellendi: ${this.getStatusText(status)}`, {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
      await this.getOrders();
    } catch (error) {
      this.alertifyService.message('Sipariş durumu güncellenemedi', {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    }
  }

  openShipModal(orderId: string) {
    this.shipOrderId = orderId;
    this.shipCargoCompany = '';
    this.shipTrackingNumber = '';
  }

  async confirmShip() {
    if (!this.shipCargoCompany || !this.shipTrackingNumber) {
      this.alertifyService.message('Lütfen kargo şirketi ve takip numarası girin', {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
      return;
    }

    try {
      await this.orderService.shipOrder(this.shipOrderId, this.shipCargoCompany, this.shipTrackingNumber);
      this.alertifyService.message(`Sipariş kargoya verildi. Kargo: ${this.shipCargoCompany}, Takip No: ${this.shipTrackingNumber}`, {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
      this.shipOrderId = '';
      await this.getOrders();
    } catch (error) {
      this.alertifyService.message('Sipariş kargoya verilemedi', {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    }
  }
}
