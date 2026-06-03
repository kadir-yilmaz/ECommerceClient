import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from './product-card/product-card.component';
import { ProductShowcaseComponent } from './product-showcase/product-showcase.component';
import { TurkishCurrencyPipe } from '../../../pipes/turkish-currency.pipe';

@NgModule({
  declarations: [
    ProductCardComponent,
    ProductShowcaseComponent,
    TurkishCurrencyPipe
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductCardComponent,
    ProductShowcaseComponent,
    TurkishCurrencyPipe
  ]
})
export class SharedUiModule { }
