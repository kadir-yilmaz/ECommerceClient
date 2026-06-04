import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';

export interface DashboardOverview {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private httpClientService: HttpClientService) { }

  async getOverview(): Promise<DashboardOverview> {
    const observable: Observable<DashboardOverview> = this.httpClientService.get<DashboardOverview>({
      controller: "dashboard",
      action: "overview"
    });

    return await firstValueFrom(observable);
  }
}
