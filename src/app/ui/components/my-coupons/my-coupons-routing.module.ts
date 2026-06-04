import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyCouponsComponent } from './my-coupons.component';

const routes: Routes = [
  { path: '', component: MyCouponsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyCouponsRoutingModule { }
