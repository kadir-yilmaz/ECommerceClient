import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyReviewsComponent } from './my-reviews.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedUiModule } from '../shared/shared-ui.module';

@NgModule({
  declarations: [
    MyReviewsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedUiModule,
    RouterModule.forChild([
      { path: "", component: MyReviewsComponent }
    ])
  ]
})
export class MyReviewsModule { }
