import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Category } from '../../../contracts/category';
import { HttpClientService } from '../http-client.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private httpClientService: HttpClientService) { }

  async getAll(successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<{ categories: Category[] }> {
    const promiseData = this.httpClientService.get<{ categories: Category[] }>({
      controller: "categories"
    }).toPromise();

    promiseData.then(() => { if (successCallBack) successCallBack() })
      .catch((errorResponse: HttpErrorResponse) => { if (errorCallBack) errorCallBack(errorResponse.message) });

    return await promiseData;
  }

  async getById(id: string, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<Category> {
    const promiseData = this.httpClientService.get<Category>({
      controller: "categories"
    }, id).toPromise();

    promiseData.then(() => { if (successCallBack) successCallBack() })
      .catch((errorResponse: HttpErrorResponse) => { if (errorCallBack) errorCallBack(errorResponse.message) });

    return await promiseData;
  }

  async create(category: { name: string, parentCategoryId?: string }, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.post({
      controller: "categories"
    }, category)
      .subscribe({
        next: () => {
          if (successCallBack) successCallBack();
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorCallBack) errorCallBack(errorResponse.message);
        }
      });
  }

  async update(category: { id: string, name: string, parentCategoryId?: string }, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    this.httpClientService.put({
      controller: "categories"
    }, category)
      .subscribe({
        next: () => {
          if (successCallBack) successCallBack();
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorCallBack) errorCallBack(errorResponse.message);
        }
      });
  }

  async delete(id: string, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    const deleteObservable = this.httpClientService.delete({
      controller: "categories"
    }, id);

    await firstValueFrom(deleteObservable).then(() => {
      if (successCallBack) successCallBack();
    }).catch(error => {
      if (errorCallBack) errorCallBack(error.message);
    });
  }
}
