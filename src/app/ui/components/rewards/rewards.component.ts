import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { RewardRule } from 'src/app/contracts/reward-rule/reward-rule';
import { RewardRuleService } from 'src/app/services/common/models/reward-rule.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss']
})
export class RewardsComponent extends BaseComponent implements OnInit {
  activeRewards: RewardRule[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private rewardRuleService: RewardRuleService,
    private customToastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.activeRewards = await this.rewardRuleService.getActiveRewardRules();
    } catch (error) {
      console.error('Error loading rewards:', error);
      this.customToastrService.message('Ödül kuralları yüklenirken bir hata oluştu.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  getGradientColors(index: number): [string, string] {
    const gradients: [string, string][] = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867']
    ];
    return gradients[index % gradients.length];
  }
}
