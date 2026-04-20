import { Component, OnInit, ViewChild } from '@angular/core';
import { ListComponent } from './list/list.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from './create/create.component';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss']
})
export class RoleComponent implements OnInit {
  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  @ViewChild(ListComponent) listComponents: ListComponent;

  createdRole(createdRole: string) {
    this.listComponents.getRoles();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateComponent, {
      width: '500px',
      disableClose: false
    });

    dialogRef.componentInstance.createdRole.subscribe(() => {
      dialogRef.close();
      this.listComponents.getRoles();
    });
  }
}

