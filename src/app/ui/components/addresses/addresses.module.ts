import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AddressesRoutingModule } from './addresses-routing.module';
import { AddressesComponent } from './addresses.component';
import { AddressFormComponent } from './address-form/address-form.component';


@NgModule({
  declarations: [
    AddressesComponent,
    AddressFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddressesRoutingModule
  ],
  exports: [
    AddressFormComponent // Export ediyoruz
  ]
})
export class AddressesModule { }
