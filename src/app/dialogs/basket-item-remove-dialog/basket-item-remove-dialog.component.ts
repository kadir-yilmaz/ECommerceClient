import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseDialog } from '../base/base-dialog';

@Component({
  selector: 'app-basket-item-remove-dialog',
  templateUrl: './basket-item-remove-dialog.component.html',
  styleUrls: ['./basket-item-remove-dialog.component.scss']
})
export class BasketItemRemoveDialogComponent extends BaseDialog<BasketItemRemoveDialogComponent> implements OnDestroy {

  constructor(dialogRef: MatDialogRef<BasketItemRemoveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BasketItemDeleteState) {
    super(dialogRef)
  }

  ngOnDestroy(): void {
    // Basket is a full page now, so there is no modal to restore.
  }
}

export enum BasketItemDeleteState {
  Yes,
  No
}
