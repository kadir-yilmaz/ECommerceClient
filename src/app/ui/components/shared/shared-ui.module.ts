import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from './product-card/product-card.component';
import { ProductShowcaseComponent } from './product-showcase/product-showcase.component';
import { TurkishCurrencyPipe } from '../../../pipes/turkish-currency.pipe';
import { ProductUrlPipe } from '../../../pipes/product-url.pipe';
import { CategoryUrlPipe } from '../../../pipes/category-url.pipe';
import { AccountSidebarComponent } from './account-sidebar/account-sidebar.component';

@NgModule({
  declarations: [
    ProductCardComponent,
    ProductShowcaseComponent,
    TurkishCurrencyPipe,
    ProductUrlPipe,
    CategoryUrlPipe,
    AccountSidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductCardComponent,
    ProductShowcaseComponent,
    TurkishCurrencyPipe,
    ProductUrlPipe,
    CategoryUrlPipe,
    AccountSidebarComponent
  ]
})
export class SharedUiModule { }
