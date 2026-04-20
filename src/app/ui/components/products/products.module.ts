import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from './products.component';
import { RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { DetailComponent } from './detail/detail.component';
import { SharedUiModule } from '../shared/shared-ui.module';


@NgModule({
  declarations: [
    ProductsComponent,
    ListComponent,
    DetailComponent
  ],
  imports: [
    CommonModule,
    SharedUiModule,
    RouterModule.forChild([
      { path: "", component: ProductsComponent },
      { path: "detail/:id", component: DetailComponent }
    ])
  ]
})
export class ProductsModule { }
