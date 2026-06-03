import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { RouterModule } from '@angular/router';
import { SharedUiModule } from '../shared/shared-ui.module';



import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    SharedUiModule,
    MatIconModule,
    RouterModule.forChild([
      { path: "", component: HomeComponent }
    ])
  ]
})
export class HomeModule { }
