import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, tap } from 'rxjs';
import { Create_Basket_Item } from '../../../contracts/basket/create_basket_item';
import { List_Basket_Item } from '../../../contracts/basket/list_basket_item';
import { Update_Basket_Item } from '../../../contracts/basket/update_basket_item';
import { HttpClientService } from '../http-client.service';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  constructor(private httpClientService: HttpClientService) { }

  private _basketItemCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public basketItemCount$: Observable<number> = this._basketItemCount.asObservable();

  private _basketItems: BehaviorSubject<List_Basket_Item[]> = new BehaviorSubject<List_Basket_Item[]>([]);
  public basketItems$: Observable<List_Basket_Item[]> = this._basketItems.asObservable();

  private getGuestBasketId(): string | null {
    return localStorage.getItem('guest_basket_id');
  }

  private setGuestBasketId(id: string): void {
    localStorage.setItem('guest_basket_id', id);
  }

  private getBasketHeaders(): any {
    const guestBasketId = this.getGuestBasketId();
    if (guestBasketId) {
      return { 'Basket-Id': guestBasketId };
    }
    return {};
  }

  async get(): Promise<List_Basket_Item[]> {
    const observable: Observable<List_Basket_Item[]> = this.httpClientService.get({
      controller: "baskets",
      headers: this.getBasketHeaders() as any
    });

    const items = await firstValueFrom(observable);
    this.updateCount(items);
    this._basketItems.next(items);
    return items;
  }

  async add(basketItem: Create_Basket_Item): Promise<void> {
    // Generate basket ID if not exists
    if (!this.getGuestBasketId()) {
      this.setGuestBasketId(this.generateGuid());
    }

    const observable: Observable<any> = this.httpClientService.post({
      controller: "baskets",
      headers: this.getBasketHeaders() as any
    }, basketItem);

    await firstValueFrom(observable);
    await this.get(); // Refresh count
  }

  async updateQuantity(basketItem: Update_Basket_Item): Promise<void> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: "baskets",
      headers: this.getBasketHeaders() as any
    }, basketItem)

    await firstValueFrom(observable);
    await this.get(); // Refresh count
  }

  async remove(basketItemId: string) {
    const observable: Observable<any> = this.httpClientService.delete({
      controller: "baskets",
      headers: this.getBasketHeaders() as any
    }, basketItemId);

    await firstValueFrom(observable);
    await this.get(); // Refresh count
  }

  async merge(guestBasketId: string): Promise<void> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "baskets",
      action: "merge"
    }, { guestBasketId });

    await firstValueFrom(observable);
    await this.get(); // Refresh basket after merge
  }

  clear(): void {
    this._basketItemCount.next(0);
    this._basketItems.next([]);
  }

  private updateCount(items: List_Basket_Item[]) {
    const totalCount = items.reduce((acc, obj) => acc + obj.quantity, 0);
    this._basketItemCount.next(totalCount);
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
