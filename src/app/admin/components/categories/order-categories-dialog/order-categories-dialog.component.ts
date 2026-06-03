import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from 'src/app/contracts/category';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-order-categories-dialog',
  templateUrl: './order-categories-dialog.component.html',
  styleUrls: ['./order-categories-dialog.component.scss']
})
export class OrderCategoriesDialogComponent {
  categories: Category[];

  constructor(
    public dialogRef: MatDialogRef<OrderCategoriesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Category[]
  ) {
    this.categories = [...data];
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
  }

  save() {
    const orders = this.categories.map((c, index) => ({
      id: c.id,
      order: index + 1
    }));
    this.dialogRef.close(orders);
  }

  cancel() {
    this.dialogRef.close();
  }
}
