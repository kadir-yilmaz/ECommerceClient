export class ProductCampaign {
    id: string;
    name: string;
    description: string;
    ruleType: string;
    discountRate?: number;
    minAmount?: number;
    minQuantity?: number;
    freeQuantity?: number;
    productId?: string;
    categoryId?: string;
}
