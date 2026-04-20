import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_Role } from '../../../../contracts/role/List_Role';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { DialogService } from '../../../../services/common/dialog.service';
import { RoleService } from '../../../../services/common/models/role.service';
import { EditComponent } from '../edit/edit.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {
  constructor(
    spinner: NgxSpinnerService,
    private roleService: RoleService,
    private alertifyService: AlertifyService,
    private dialogService: DialogService,
    private dialog: MatDialog
  ) {
    super(spinner)
  }

  displayedColumns: string[] = ['name', 'actions'];
  dataSource: MatTableDataSource<List_Role> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  async getRoles() {
    this.showSpinner(SpinnerType.BallAtom);
    
    try {
      const allRoles: { datas: List_Role[], totalCount: number } = await this.roleService.getRoles(
        this.paginator ? this.paginator.pageIndex : 0, 
        this.paginator ? this.paginator.pageSize : 10, 
        () => this.hideSpinner(SpinnerType.BallAtom), 
        (error: any) => {
          const errorMessage = error?.error?.message || error?.message || 'Roller yüklenirken hata oluştu';
          this.alertifyService.message(errorMessage, {
            dismissOthers: true,
            messageType: MessageType.Error,
            position: Position.BottomRight
          });
          this.hideSpinner(SpinnerType.BallAtom);
        }
      );

      this.dataSource = new MatTableDataSource<List_Role>(allRoles.datas);
      if (this.paginator) {
        this.paginator.length = allRoles.totalCount;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Roller yüklenirken hata oluştu';
      this.alertifyService.message(errorMessage, {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  editPermissions(role: List_Role) {
    const dialogRef = this.dialog.open(EditComponent, {
      width: '950px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { role: role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getRoles();
      }
    });
  }

  async deleteRole(role: List_Role, event: Event) {
    event.stopPropagation();
    
    const confirmed = confirm(`"${role.name}" rolünü silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.roleService.deleteRole(
        role.id,
        () => {
          this.alertifyService.message('Rol başarıyla silindi', {
            messageType: MessageType.Success,
            position: Position.BottomRight
          });
          this.getRoles();
        },
        (error) => {
          const errorMessage = error?.error?.message || error?.message || 'Rol silinirken hata oluştu';
          this.alertifyService.message(errorMessage, {
            messageType: MessageType.Error,
            position: Position.BottomRight
          });
        }
      );
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Rol silinirken hata oluştu';
      this.alertifyService.message(errorMessage, {
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async pageChanged() {
    await this.getRoles();
  }

  async ngOnInit() {
    await this.getRoles();
  }
}
