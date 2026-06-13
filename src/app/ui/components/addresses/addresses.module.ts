import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AddressesRoutingModule } from './addresses-routing.module';
import { AddressesComponent } from './addresses.component';
import { AddressFormComponent } from './address-form/address-form.component';
import { SharedUiModule } from '../shared/shared-ui.module';


@NgModule({
  declarations: [
    AddressesComponent,
    AddressFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddressesRoutingModule,
    SharedUiModule
  ],
  exports: [
    AddressFormComponent // Export ediyoruz
  ]
})
export class AddressesModule { }
