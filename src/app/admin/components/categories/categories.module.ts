import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesComponent } from './categories.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { OrderCategoriesDialogComponent } from './order-categories-dialog/order-categories-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    CategoriesComponent,
    OrderCategoriesDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    DragDropModule,
    MatDialogModule,
    MatButtonModule,
    RouterModule.forChild([
      { path: "", component: CategoriesComponent }
    ])
  ]
})
export class CategoriesModule { }
