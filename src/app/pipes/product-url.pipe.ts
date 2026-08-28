import { Pipe, PipeTransform } from '@angular/core';
import { generateProductUrl } from '../utils/slug-utils';

@Pipe({
  name: 'productUrl'
})
export class ProductUrlPipe implements PipeTransform {
  transform(product: any): string {
    return generateProductUrl(product);
  }
}
