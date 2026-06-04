import { List_Product } from "../list_product";

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
  brand?: string;
  endDate?: Date | string;
  isActive: boolean;
  product?: List_Product;
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
  brand?: string;
  endDate?: Date | string;
  isActive: boolean;
}

export class Update_Campaign extends Create_Campaign {
  id: string;
}
