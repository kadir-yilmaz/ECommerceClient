import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasketsComponent } from './baskets.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    BasketsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      { path: "", component: BasketsComponent }
    ])
  ],
  exports: [
    BasketsComponent
  ]
})
export class BasketsModule { }
