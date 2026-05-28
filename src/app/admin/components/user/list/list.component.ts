import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_User } from '../../../../contracts/users/list_user';
import { AuthorizeUserDialogComponent } from '../../../../dialogs/authorize-user-dialog/authorize-user-dialog.component';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { DialogService } from '../../../../services/common/dialog.service';
import { UserService } from '../../../../services/common/models/user.service';
import { UserDetailsDialogComponent } from '../../../../dialogs/user-details-dialog/user-details-dialog.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent extends BaseComponent implements OnInit {
  dataSource: MatTableDataSource<List_User> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  searchText: string = '';
  allUsers: List_User[] = [];
  filteredSuggestions: List_User[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private userService: UserService,
    private alertifyService: AlertifyService,
    private dialogService: DialogService
  ) {
    super(spinner)
  }

  async getUsers() {
    this.showSpinner(SpinnerType.BallAtom);

    try {
      const result: { totalUsersCount: number; users: List_User[] } = await this.userService.getAllUsers(
        this.paginator ? this.paginator.pageIndex : 0, 
        this.paginator ? this.paginator.pageSize : 9, 
        () => this.hideSpinner(SpinnerType.BallAtom), 
        (error: any) => {
          const errorMessage = error?.error?.message || error?.message || 'Kullanıcılar yüklenirken hata oluştu';
          this.alertifyService.message(errorMessage, {
            dismissOthers: true,
            messageType: MessageType.Error,
            position: Position.BottomRight
          });
          this.hideSpinner(SpinnerType.BallAtom);
        }
      );
      
      this.allUsers = result.users;
      this.applyFilter();
      
      if (this.paginator) {
        this.paginator.length = result.totalUsersCount;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Kullanıcılar yüklenirken hata oluştu';
      this.alertifyService.message(errorMessage, {
        dismissOthers: true,
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  applyFilter() {
    let filteredUsers = this.allUsers;
    
    if (this.searchText && this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      filteredUsers = this.allUsers.filter(user => 
        user.email.toLowerCase().includes(search) ||
        user.userName.toLowerCase().includes(search) ||
        user.nameSurname.toLowerCase().includes(search)
      );
    }
    
    this.dataSource = new MatTableDataSource<List_User>(filteredUsers);
  }

  onSearchChange() {
    this.applyFilter();
    this.updateSuggestions();
  }

  updateSuggestions() {
    if (!this.searchText || !this.searchText.trim()) {
      this.filteredSuggestions = [];
      return;
    }

    const search = this.searchText.toLowerCase().trim();
    this.filteredSuggestions = this.allUsers
      .filter(user => 
        user.email.toLowerCase().includes(search) ||
        user.userName.toLowerCase().includes(search) ||
        user.nameSurname.toLowerCase().includes(search)
      )
      .slice(0, 5); // Maksimum 5 öneri göster
  }

  onUserSelected(event: MatAutocompleteSelectedEvent) {
    const selectedUsername = event.option.value;
    this.searchText = selectedUsername;
    this.applyFilter();
  }

  clearSearch() {
    this.searchText = '';
    this.filteredSuggestions = [];
    this.applyFilter();
  }

  async pageChanged() {
    await this.getUsers();
  }

  async ngOnInit() {
    await this.getUsers();
  }

  assignRole(id: string) {
    this.dialogService.openDialog({
      componentType: AuthorizeUserDialogComponent,
      data: id,
      options: {
        width: "750px"
      },
      afterClosed: () => {
        this.alertifyService.message("Roller başarıyla atanmıştır!", {
          messageType: MessageType.Success,
          position: Position.BottomRight
        });
        this.getUsers();
      }
    });
  }

  changeUserPassword(user: List_User) {
    // TODO: Implement password change dialog
    this.alertifyService.message("Şifre değiştirme özelliği yakında eklenecek", {
      messageType: MessageType.Message,
      position: Position.BottomRight
    });
  }

  viewUserDetails(user: List_User) {
    this.dialogService.openDialog({
      componentType: UserDetailsDialogComponent,
      data: user,
      options: {
        width: "600px"
      }
    });
  }

  deleteUser(user: List_User) {
    const confirmed = confirm(`"${user.userName}" kullanıcısını silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    // TODO: Implement user delete
    this.alertifyService.message("Kullanıcı silme özelliği yakında eklenecek", {
      messageType: MessageType.Message,
      position: Position.BottomRight
    });
  }
}
