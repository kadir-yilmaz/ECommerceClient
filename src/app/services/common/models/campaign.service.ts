import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { Campaign, Create_Campaign, Update_Campaign } from 'src/app/contracts/campaign/campaign';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

  constructor(private httpClientService: HttpClientService) { }

  async getAllCampaigns(): Promise<Campaign[]> {
    const observable = this.httpClientService.get<{ campaigns: Campaign[] }>({
      controller: 'campaigns'
    });

    const response = await firstValueFrom(observable);
    return response.campaigns;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const observable = this.httpClientService.get<{ campaigns: Campaign[] }>({
      controller: 'campaigns',
      action: 'active'
    });

    const response = await firstValueFrom(observable);
    return response.campaigns;
  }

  async getCampaignById(id: string): Promise<Campaign> {
    const observable = this.httpClientService.get<Campaign>({
      controller: 'campaigns',
      action: 'detail'
    }, id);

    return await firstValueFrom(observable);
  }

  async createCampaign(campaign: Create_Campaign): Promise<void> {
    const observable = this.httpClientService.post({
      controller: 'campaigns'
    }, campaign);

    await firstValueFrom(observable);
  }

  async updateCampaign(campaign: Update_Campaign): Promise<void> {
    const observable = this.httpClientService.put({
      controller: 'campaigns'
    }, campaign);

    await firstValueFrom(observable);
  }

  async deleteCampaign(id: string): Promise<void> {
    const observable = this.httpClientService.delete({
      controller: 'campaigns'
    }, id);

    await firstValueFrom(observable);
  }
}
