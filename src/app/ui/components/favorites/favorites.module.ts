import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FavoritesComponent } from './favorites.component';

@NgModule({
  declarations: [
    FavoritesComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      { path: '', component: FavoritesComponent }
    ])
  ]
})
export class FavoritesModule { }
