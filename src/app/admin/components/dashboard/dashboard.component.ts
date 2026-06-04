import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { AlertifyService, MessageType, Position } from 'src/app/services/admin/alertify.service';
import { HubUrls } from '../../../constants/hub-urls';
import { ReceiveFunctions } from '../../../constants/receive-functions';
import { SignalRService } from '../../../services/common/signalr.service';
import { DashboardService, DashboardOverview } from '../../../services/common/models/dashboard.service';
import { CategoryService } from '../../../services/common/models/category.service';
import { Category } from 'src/app/contracts/category';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit {
  overview: DashboardOverview = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  };

  categoryStats: any[] = [];

  constructor(
    private alertify: AlertifyService,
    spinner: NgxSpinnerService,
    private signalRService: SignalRService,
    private dashboardService: DashboardService,
    private categoryService: CategoryService
  ) {
    super(spinner)
  }

  async ngOnInit(): Promise<void> {
    this.signalRService.on(HubUrls.ProductHub, ReceiveFunctions.ProductAddedMessageReceiveFunction, message => {
      this.alertify.message(message, {
        messageType: MessageType.Notify,
        position: Position.BottomRight
      })
    });
    this.signalRService.on(HubUrls.OrderHub, ReceiveFunctions.OrderAddedMessageReceiveFunction, message => {
      this.alertify.message(message, {
        messageType: MessageType.Notify,
        position: Position.TopCenter
      })
    });

    await this.loadData();
  }

  buildTree(categories: Category[], parentId: string = null): any[] {
    return categories
      .filter(c => (c.parentCategoryId || null) === parentId)
      .map(c => {
        const children = this.buildTree(categories, c.id);
        const childrenProductCount = children.reduce((sum, child) => sum + (child.totalProductCount || 0), 0);
        return {
          ...c,
          children: children,
          totalProductCount: (c.productCount || 0) + childrenProductCount
        };
      });
  }

  async loadData() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.overview = await this.dashboardService.getOverview();
      const categoriesResult = await this.categoryService.getAll();
      if (categoriesResult && categoriesResult.categories) {
        const tree = this.buildTree(categoriesResult.categories);
        this.categoryStats = tree;
      }
    } catch (error) {
      this.alertify.message("Dashboard verileri alınırken hata oluştu.", {
        messageType: MessageType.Error,
        position: Position.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async refreshData() {
    await this.loadData();
    this.alertify.message("Veriler güncellendi", {
      messageType: MessageType.Success,
      position: Position.BottomRight
    });
  }

  m() {
    this.alertify.message("Merhaba", {
      messageType: MessageType.Success,
      delay: 5,
      position: Position.BottomRight
    })
  }

  d() {
    this.alertify.dismiss();
  }
}
