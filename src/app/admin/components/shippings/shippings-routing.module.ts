import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShippingsComponent } from './shippings.component';

const routes: Routes = [
  { path: '', component: ShippingsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShippingsRoutingModule { }
