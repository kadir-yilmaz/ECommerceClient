import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserComponent } from './user.component';
import { ListComponent } from './list/list.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DeleteDirectiveModule } from '../../../directives/admin/delete.directive.module';
import { DialogModule } from '../../../dialogs/dialog.module';
import { RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [
    UserComponent,
    ListComponent,
    ProfileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    DialogModule,
    DeleteDirectiveModule,
    RouterModule.forChild([
      { path: "", component: UserComponent },
      { path: "profile", component: ProfileComponent }
    ]),
  ]
})
export class UserModule { }
