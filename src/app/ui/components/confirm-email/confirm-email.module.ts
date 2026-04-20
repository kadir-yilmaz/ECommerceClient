import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmEmailComponent } from './confirm-email.component';

@NgModule({
  declarations: [
    ConfirmEmailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: ConfirmEmailComponent }
    ])
  ]
})
export class ConfirmEmailModule { }
