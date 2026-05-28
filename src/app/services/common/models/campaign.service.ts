import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';

export interface CampaignImage {
  id: string;
  path: string;
  fileName: string;
  showcase: boolean;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

  constructor(private httpClientService: HttpClientService) { }

  async getCampaignImages(): Promise<CampaignImage[]> {
    const observable = this.httpClientService.get<CampaignImage[]>({
      controller: 'campaigns'
    });

    return await firstValueFrom(observable);
  }

  async deleteCampaignImage(id: string): Promise<void> {
    const observable = this.httpClientService.delete({
      controller: 'campaigns'
    }, id);

    await firstValueFrom(observable);
  }

  async updateCampaignImageTitle(id: string, title: string): Promise<void> {
    const observable = this.httpClientService.put({
      controller: 'campaigns',
      action: 'update-title'
    }, { id, title });

    await firstValueFrom(observable);
  }
}
