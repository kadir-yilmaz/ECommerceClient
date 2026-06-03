import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasketsComponent } from './baskets.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SharedUiModule } from '../shared/shared-ui.module';

import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    BasketsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    SharedUiModule,
    FormsModule,
    RouterModule.forChild([
      { path: "", component: BasketsComponent }
    ])
  ],
  exports: [
    BasketsComponent
  ]
})
export class BasketsModule { }
