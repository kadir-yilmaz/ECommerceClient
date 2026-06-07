import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { Address } from '../../../contracts/address/address';
import { CreateAddress } from '../../../contracts/address/create-address';
import { UpdateAddress } from '../../../contracts/address/update-address';
import { AddressType } from '../../../contracts/address/address-type.enum';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  constructor(private httpClientService: HttpClientService) { }

  async getUserAddresses(type?: AddressType): Promise<Address[]> {
    const queryParams = type !== undefined ? `?type=${type}` : '';
    const observable: Observable<Address[]> = this.httpClientService.get<Address[]>({
      controller: 'addresses' + queryParams
    });
    return await firstValueFrom(observable);
  }

  async getAddressById(id: string): Promise<Address> {
    const observable: Observable<Address> = this.httpClientService.get<Address>({
      controller: 'addresses'
    }, id);
    return await firstValueFrom(observable);
  }

  async createAddress(createAddress: CreateAddress): Promise<Address> {
    const observable: Observable<Address> = this.httpClientService.post<Address>({
      controller: 'addresses'
    }, createAddress);
    return await firstValueFrom(observable);
  }

  async updateAddress(updateAddress: UpdateAddress): Promise<Address> {
    const observable: Observable<Address> = this.httpClientService.put<Address>({
      controller: `addresses/${updateAddress.id}`
    }, updateAddress);
    return await firstValueFrom(observable);
  }

  async deleteAddress(id: string): Promise<void> {
    const observable: Observable<void> = this.httpClientService.delete({
      controller: 'addresses'
    }, id);
    return await firstValueFrom(observable);
  }

  async setDefaultAddress(id: string, type: AddressType): Promise<any> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: `addresses/${id}/set-default?type=${type}`
    }, {});
    return await firstValueFrom(observable);
  }
}
