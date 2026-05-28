//'orderCode', 'userName', 'totalPrice', 'createdDate'
export class List_Order {
  id: string;
  orderCode: string;
  userName: string;
  totalPrice: number;
  createdDate: Date;
  completed: boolean;
  status: number;
  cargoCompany?: string;
  trackingNumber?: string;
}
