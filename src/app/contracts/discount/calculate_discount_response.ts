import { DiscountDetail } from "./discount_detail";

export class CalculateDiscountResponse {
    originalTotal: number;
    totalDiscount: number;
    finalTotal: number;
    isShippingFree: boolean;
    shippingFee: number;
    shippingThreshold: number;
    appliedDiscounts: DiscountDetail[];
}
