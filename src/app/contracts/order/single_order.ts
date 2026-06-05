export class OrderDiscount {
  discountName: string;
  discountType: string;
  discountAmount: number;
}

export class SingleOrder {
  address: string;
  basketItems: any[];
  createdDate: Date;
  description: string;
  id: string;
  orderCode: string;
  completed: boolean;
  status: number;
  cargoCompany?: string;
  trackingNumber?: string;
  /** Ham ürün toplamı (indirimler öncesi) */
  basePrice?: number;
  /** Toplam indirim tutarı */
  totalDiscount?: number;
  /** Ödenecek net tutar */
  totalPrice?: number;
  /** Uygulanan indirimler */
  orderDiscounts?: OrderDiscount[];
}

