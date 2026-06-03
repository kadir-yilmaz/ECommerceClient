import { List_Product_Image } from "./list_product_image";

import { ProductCampaign } from "./product_campaign";

export class List_Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  createdDate: Date;
  updatedDate: Date;
  productImageFiles?: List_Product_Image[];
  imagePath: string;
  categoryId?: string;
  campaigns?: ProductCampaign[];
  showOnHomepage?: boolean;
}


