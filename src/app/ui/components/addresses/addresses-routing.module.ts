import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddressesComponent } from './addresses.component';
import { AddressFormComponent } from './address-form/address-form.component';

const routes: Routes = [
  {
    path: '',
    component: AddressesComponent
  },
  {
    path: 'create',
    component: AddressFormComponent
  },
  {
    path: 'edit/:id',
    component: AddressFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddressesRoutingModule { }
