import { ProductCampaign } from "../product_campaign";

export class List_Basket_Item {
  basketItemId: string;
  name: string;
  price: number;
  quantity: number;
  productId: string;
  categoryId: string;
  campaigns?: ProductCampaign[];
}
