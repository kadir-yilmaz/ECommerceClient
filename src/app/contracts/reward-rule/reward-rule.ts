export class RewardRule {
  id: string;
  name: string;
  minTotalSpent: number;
  periodInDays: number;
  rewardDiscountType: string;
  rewardDiscountValue: number;
  rewardMaxDiscountAmount?: number;
  couponValidityDays: number;
  couponMinCartAmount: number;
  isActive: boolean;
  createdDate: Date;
}

export class Create_RewardRule {
  name: string;
  minTotalSpent: number;
  periodInDays: number;
  rewardDiscountType: string;
  rewardDiscountValue: number;
  rewardMaxDiscountAmount?: number;
  couponValidityDays: number;
  couponMinCartAmount: number;
  isActive: boolean;
}

export class Update_RewardRule extends Create_RewardRule {
  id: string;
}
