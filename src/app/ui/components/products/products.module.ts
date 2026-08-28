import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from './products.component';
import { RouterModule, UrlSegment } from '@angular/router';
import { ListComponent } from './list/list.component';
import { DetailComponent } from './detail/detail.component';
import { SharedUiModule } from '../shared/shared-ui.module';
import { FormsModule } from '@angular/forms';

export function productUrlMatcher(segments: UrlSegment[]) {
  if (segments.length === 1 && segments[0].path.includes('-p-')) {
    return { consumed: segments, posParams: { slug: segments[0] } };
  }
  return null;
}

export function categoryUrlMatcher(segments: UrlSegment[]) {
  if (segments.length === 1 && segments[0].path.includes('-c-')) {
    return { consumed: segments, posParams: { slug: segments[0] } };
  }
  return null;
}

@NgModule({
  declarations: [
    ProductsComponent,
    ListComponent,
    DetailComponent
  ],
  imports: [
    CommonModule,
    SharedUiModule,
    FormsModule,
    RouterModule.forChild([
      { path: "", component: ProductsComponent },
      { path: "detail/:id", component: DetailComponent },
      { matcher: productUrlMatcher, component: DetailComponent },
      { matcher: categoryUrlMatcher, component: ProductsComponent }
    ])
  ]
})
export class ProductsModule { }
