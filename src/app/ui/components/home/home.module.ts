import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { RouterModule } from '@angular/router';
import { SharedUiModule } from '../shared/shared-ui.module';



@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    SharedUiModule,
    RouterModule.forChild([
      { path: "", component: HomeComponent }
    ])
  ]
})
export class HomeModule { }
