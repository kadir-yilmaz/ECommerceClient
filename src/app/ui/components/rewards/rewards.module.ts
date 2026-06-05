import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RewardsComponent } from './rewards.component';

@NgModule({
  declarations: [
    RewardsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      { path: '', component: RewardsComponent }
    ])
  ]
})
export class RewardsModule { }
