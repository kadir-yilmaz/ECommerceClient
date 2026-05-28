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
}
