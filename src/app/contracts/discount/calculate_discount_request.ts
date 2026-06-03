export class CalculateDiscountRequest {
    items: CalculateDiscountItem[];
    couponCode?: string;
}

export class CalculateDiscountItem {
    productId: string;
    productName: string;
    categoryId: string;
    quantity: number;
    unitPrice: number;
}
