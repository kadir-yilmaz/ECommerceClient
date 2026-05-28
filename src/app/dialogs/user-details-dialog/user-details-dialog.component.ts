import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { List_User } from '../../contracts/users/list_user';
import { BaseDialog } from '../base/base-dialog';

@Component({
  selector: 'app-user-details-dialog',
  templateUrl: './user-details-dialog.component.html',
  styleUrls: ['./user-details-dialog.component.scss']
})
export class UserDetailsDialogComponent extends BaseDialog<UserDetailsDialogComponent> implements OnInit {

  constructor(
    dialogRef: MatDialogRef<UserDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: List_User
  ) {
    super(dialogRef);
  }

  ngOnInit(): void {
  }

}
