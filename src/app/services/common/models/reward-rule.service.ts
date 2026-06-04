import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { RewardRule, Create_RewardRule, Update_RewardRule } from 'src/app/contracts/reward-rule/reward-rule';

@Injectable({
  providedIn: 'root'
})
export class RewardRuleService {

  constructor(private httpClientService: HttpClientService) { }

  async getAllRewardRules(): Promise<RewardRule[]> {
    const observable = this.httpClientService.get<{ rules: RewardRule[] }>({
      controller: 'rewardrules'
    });

    const response = await firstValueFrom(observable);
    return response.rules || [];
  }

  async getActiveRewardRules(): Promise<RewardRule[]> {
    const observable = this.httpClientService.get<{ rules: RewardRule[] }>({
      controller: 'rewardrules',
      action: 'active'
    });

    const response = await firstValueFrom(observable);
    return response.rules || [];
  }

  async createRewardRule(rule: Create_RewardRule): Promise<void> {
    const observable = this.httpClientService.post({
      controller: 'rewardrules'
    }, rule);

    await firstValueFrom(observable);
  }

  async updateRewardRule(rule: Update_RewardRule): Promise<void> {
    const observable = this.httpClientService.put({
      controller: 'rewardrules'
    }, rule);

    await firstValueFrom(observable);
  }

  async deleteRewardRule(id: string): Promise<void> {
    const observable = this.httpClientService.delete({
      controller: 'rewardrules'
    }, id);

    await firstValueFrom(observable);
  }
}
