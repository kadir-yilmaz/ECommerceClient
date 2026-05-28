import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'turkishCurrency'
})
export class TurkishCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';

    const hasDecimal = value % 1 !== 0;

    const formatted = value.toLocaleString('tr-TR', {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0
    });

    return `${formatted} TL`;
  }
}
