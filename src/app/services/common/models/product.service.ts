import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Create_Product } from '../../../contracts/create_product';
import { List_Product } from '../../../contracts/list_product';
import { List_Product_Image } from '../../../contracts/list_product_image';
import { HttpClientService } from '../http-client.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private httpClientService: HttpClientService) { }

  create(product: FormData, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.post({
      controller: "products"
    }, product)
      .subscribe(result => {
        if (successCallBack) successCallBack();
      }, (errorResponse: HttpErrorResponse) => {
        const _error: Array<{ key: string, value: Array<string> }> = errorResponse.error;
        let message = "";
        if (_error) {
          _error.forEach((v, index) => {
            v.value.forEach((_v, _index) => {
              message += `${_v}<br>`;
            });
          });
        }
        if (errorCallBack) errorCallBack(message || errorResponse.message);
      });
  }

  create_json(product: any, successCallBack?: (productId?: string) => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.post<any>({
      controller: "products"
    }, product)
      .subscribe((result: any) => {
        if (successCallBack) successCallBack(result?.id);
      }, (errorResponse: HttpErrorResponse) => {
        const _error: Array<{ key: string, value: Array<string> }> = errorResponse.error;
        let message = "";
        if (_error) {
          _error.forEach((v, index) => {
            v.value.forEach((_v, _index) => {
              message += `${_v}<br>`;
            });
          });
        }
        if (errorCallBack) errorCallBack(message || errorResponse.message);
      });
  }

  update(product: FormData, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.put({
      controller: "products"
    }, product)
      .subscribe(result => {
        if (successCallBack) successCallBack();
      }, (errorResponse: HttpErrorResponse) => {
        const _error: Array<{ key: string, value: Array<string> }> = errorResponse.error;
        let message = "";
        if (_error) {
          _error.forEach((v, index) => {
            v.value.forEach((_v, _index) => {
              message += `${_v}<br>`;
            });
          });
        }
        if (errorCallBack) errorCallBack(message || errorResponse.message);
      });
  }

  async read(page: number = 0, size: number = 5, categoryId?: string, sortType?: string, searchTerm?: string, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<{ totalProductCount: number; products: List_Product[] }> {
    let queryString = `page=${page}&size=${size}`;
    if (categoryId) queryString += `&categoryId=${categoryId}`;
    if (sortType) queryString += `&sortType=${sortType}`;
    if (searchTerm) queryString += `&search=${encodeURIComponent(searchTerm)}`;

    const promiseData: Promise<{ totalProductCount: number; products: List_Product[] }> = this.httpClientService.get<{ totalProductCount: number; products: List_Product[] }>({
      controller: "products",
      queryString: queryString
    }).toPromise();

    promiseData.then(d => successCallBack())
      .catch((errorResponse: HttpErrorResponse) => errorCallBack(errorResponse.message))

    return await promiseData;
  }

  async readById(id: string, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<List_Product> {
    const promiseData: Promise<List_Product> = this.httpClientService.get<List_Product>({
      controller: "products"
    }, id).toPromise();

    promiseData.then(() => successCallBack())
      .catch((errorResponse: HttpErrorResponse) => errorCallBack(errorResponse.message));

    return await promiseData;
  }

  async delete(id: string) {
    const deleteObservable: Observable<any> = this.httpClientService.delete<any>({
      controller: "products"
    }, id);

    await firstValueFrom(deleteObservable);
  }

  async readImages(id: string, successCallBack?: () => void): Promise<List_Product_Image[]> {
    const getObservable: Observable<List_Product_Image[]> = this.httpClientService.get<List_Product_Image[]>({
      action: "getproductimages",
      controller: "products"
    }, id);

    const images: List_Product_Image[] = await firstValueFrom(getObservable);
    successCallBack();
    return images;
  }

  async deleteImage(id: string, imageId: string, successCallBack?: () => void) {
    const deleteObservable = this.httpClientService.delete({
      action: "deleteproductimage",
      controller: "products",
      queryString: `imageId=${imageId}`
    }, id)
    await firstValueFrom(deleteObservable);
    successCallBack();
  }

  async changeShowcaseImage(imageId: string, productId: string, successCallBack?: () => void): Promise<void> {
    const changeShowcaseImageObservable = this.httpClientService.get({
      controller: "products",
      action: "ChangeShowcaseImage",
      queryString: `imageId=${imageId}&productId=${productId}`
    });
    await firstValueFrom(changeShowcaseImageObservable);
    successCallBack();
  }

  async updateStockQrCodeToProduct(productId: string, stock: number, successCallBack?: () => void) {
    const observable = this.httpClientService.put({
      action: "qrcode",
      controller: "products"
    }, {
      productId, stock
    });

    await firstValueFrom(observable);
    successCallBack();
  }

  update_json(product: any, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.put({
      controller: "products"
    }, product)
      .subscribe(result => {
        if (successCallBack) successCallBack();
      }, (errorResponse: HttpErrorResponse) => {
        const _error: Array<{ key: string, value: Array<string> }> = errorResponse.error;
        let message = "";
        if (_error) {
          _error.forEach((v, index) => {
            v.value.forEach((_v, _index) => {
              message += `${_v}<br>`;
            });
          });
        }
        if (errorCallBack) errorCallBack(message || errorResponse.message);
      });
  }

  async uploadImages(productId: string, formData: FormData, successCallBack?: () => void) {
    const observable = this.httpClientService.post({
      controller: "products",
      action: "upload",
      queryString: `id=${productId}`
    }, formData);

    await firstValueFrom(observable);
    if (successCallBack) successCallBack();
  }

  async getSearchSuggestions(q: string): Promise<Array<{ text: string, type: string, targetId?: string }>> {
    const observable = this.httpClientService.get<Array<{ text: string, type: string, targetId?: string }>>({
      controller: "products",
      action: "search-suggestions",
      queryString: `q=${encodeURIComponent(q)}`
    });
    return await firstValueFrom(observable);
  }
}
