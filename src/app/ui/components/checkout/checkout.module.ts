import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutComponent } from './checkout.component';
import { SharedUiModule } from '../shared/shared-ui.module';
import { AddressesModule } from '../addresses/addresses.module';


@NgModule({
  declarations: [
    CheckoutComponent
  ],
  imports: [
    CommonModule,
    CheckoutRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    SharedUiModule,
    AddressesModule
  ]
})
export class CheckoutModule { }
