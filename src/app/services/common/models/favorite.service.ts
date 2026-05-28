import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Create_Favorite_Item } from 'src/app/contracts/favorite/create_favorite_item';
import { List_Favorite_Item } from 'src/app/contracts/favorite/list_favorite_item';
import { HttpClientService } from '../http-client.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private httpClientService: HttpClientService) { }

  private _favoriteItemCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public favoriteItemCount$: Observable<number> = this._favoriteItemCount.asObservable();

  private _favoriteItems: BehaviorSubject<List_Favorite_Item[]> = new BehaviorSubject<List_Favorite_Item[]>([]);
  public favoriteItems$: Observable<List_Favorite_Item[]> = this._favoriteItems.asObservable();

  async get(): Promise<List_Favorite_Item[]> {
    const observable: Observable<List_Favorite_Item[]> = this.httpClientService.get({
      controller: 'favorites'
    });

    const items = await firstValueFrom(observable);
    this._favoriteItems.next(items);
    this._favoriteItemCount.next(items.length);
    return items;
  }

  async add(productId: string): Promise<void> {
    const favoriteItem: Create_Favorite_Item = new Create_Favorite_Item();
    favoriteItem.productId = productId;

    const observable: Observable<any> = this.httpClientService.post({
      controller: 'favorites'
    }, favoriteItem);

    await firstValueFrom(observable);
    await this.get();
  }

  async remove(favoriteItemId: string): Promise<void> {
    const observable: Observable<any> = this.httpClientService.delete({
      controller: 'favorites'
    }, favoriteItemId);

    await firstValueFrom(observable);
    await this.get();
  }

  async removeByProductId(productId: string): Promise<void> {
    const observable: Observable<any> = this.httpClientService.delete({
      controller: 'favorites',
      action: 'product'
    }, productId);

    await firstValueFrom(observable);
    await this.get();
  }

  async toggle(productId: string): Promise<boolean> {
    const currentItems = this._favoriteItems.value;
    const existingItem = currentItems.find(item => item.productId === productId);

    if (existingItem) {
      await this.remove(existingItem.favoriteItemId);
      return false;
    }

    await this.add(productId);
    return true;
  }

  clear(): void {
    this._favoriteItemCount.next(0);
    this._favoriteItems.next([]);
  }

  isFavorite(productId: string): boolean {
    return this._favoriteItems.value.some(item => item.productId === productId);
  }
}
