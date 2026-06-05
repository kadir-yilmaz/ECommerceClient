//'orderCode', 'userName', 'totalPrice', 'createdDate'
export class List_Order {
  id: string;
  orderCode: string;
  userName: string;
  /** Ham ürün toplamı (indirimler öncesi) */
  basePrice?: number;
  /** Toplam indirim tutarı */
  totalDiscount?: number;
  /** Ödenecek net tutar */
  totalPrice: number;
  createdDate: Date;
  completed: boolean;
  status: number;
  cargoCompany?: string;
  trackingNumber?: string;
  orderDiscounts?: { discountName: string; discountType: string; discountAmount: number }[];
}

