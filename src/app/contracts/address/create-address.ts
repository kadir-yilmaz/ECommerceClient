import { AddressCategory } from './address-category.enum';
import { AddressType } from './address-type.enum';

export interface CreateAddress {
  addressType: AddressType;
  category: AddressCategory;
  closedDays?: string;
  title: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  province: string;
  district: string;
  neighborhood: string;
  postalCode: string;
  addressDetail: string;
}
