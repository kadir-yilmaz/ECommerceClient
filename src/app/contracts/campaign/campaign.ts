export class Campaign {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  minAmount?: number;
  discountRate?: number;
  minQuantity?: number;
  freeQuantity?: number;
  productId?: string;
  categoryId?: string;
  isActive: boolean;
}

export class Create_Campaign {
  name: string;
  description: string;
  ruleType: string;
  minAmount?: number;
  discountRate?: number;
  minQuantity?: number;
  freeQuantity?: number;
  productId?: string;
  categoryId?: string;
  isActive: boolean;
}

export class Update_Campaign extends Create_Campaign {
  id: string;
}
