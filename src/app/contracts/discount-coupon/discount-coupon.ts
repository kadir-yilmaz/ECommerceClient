export class CouponUserDto {
  userName: string;
  isUsed: boolean;
}

export class DiscountCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minCartAmount: number;
  isActive: boolean;
  expirationDate?: Date;
  usedCount: number;
  scope: string;
  isRewardCoupon: boolean;
  assignedUsers?: CouponUserDto[];
  isUsed?: boolean;
  isExpired?: boolean;
}

export class Create_DiscountCoupon {
  code: string;
  discountType: string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minCartAmount: number;
  isActive: boolean;
  expirationDate?: Date;
  scope: string;
  userIds?: string[];
}

export class Update_DiscountCoupon extends Create_DiscountCoupon {
  id: string;
}
