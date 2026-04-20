import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from './product-card/product-card.component';

@NgModule({
  declarations: [
    ProductCardComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductCardComponent
  ]
})
export class SharedUiModule { }
