import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from './product-card/product-card.component';
import { TurkishCurrencyPipe } from '../../../pipes/turkish-currency.pipe';

@NgModule({
  declarations: [
    ProductCardComponent,
    TurkishCurrencyPipe
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductCardComponent,
    TurkishCurrencyPipe
  ]
})
export class SharedUiModule { }
