export class DiscountCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minCartAmount: number;
  isActive: boolean;
  expirationDate?: Date;
  usageLimit?: number;
  usedCount: number;
}

export class Create_DiscountCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  minCartAmount: number;
  isActive: boolean;
  expirationDate?: Date;
  usageLimit?: number;
}

export class Update_DiscountCoupon extends Create_DiscountCoupon {
  id: string;
}
