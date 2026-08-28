import { Pipe, PipeTransform } from '@angular/core';
import { generateCategoryUrl } from '../utils/slug-utils';

@Pipe({
  name: 'categoryUrl'
})
export class CategoryUrlPipe implements PipeTransform {
  transform(category: any): string {
    return generateCategoryUrl(category);
  }
}
