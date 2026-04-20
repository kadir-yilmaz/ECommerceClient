import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleComponent } from './role.component';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTreeModule } from '@angular/material/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CreateComponent } from './create/create.component';
import { EditComponent } from './edit/edit.component';
import { ListComponent } from './list/list.component';
import { DeleteDirectiveModule } from '../../../directives/admin/delete.directive.module';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    RoleComponent,
    CreateComponent,
    EditComponent,
    ListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatTreeModule,
    MatCheckboxModule,
    RouterModule.forChild([
      { path: "", component: RoleComponent }
    ]),
    MatSidenavModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatTableModule, 
    MatPaginatorModule,
    DeleteDirectiveModule
  ]
})
export class RoleModule { }
