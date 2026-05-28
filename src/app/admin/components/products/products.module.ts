import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from './products.component';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CreateComponent } from './create/create.component';
import { ListComponent } from './list/list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { FileUploadModule } from '../../../services/common/file-upload/file-upload.module';
import { DialogModule } from '../../../dialogs/dialog.module';
import { DeleteDirectiveModule } from '../../../directives/admin/delete.directive.module';

import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UpdateComponent } from './update/update.component';

@NgModule({
  declarations: [
    ProductsComponent,
    CreateComponent,
    ListComponent,
    UpdateComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      {
        path: "", component: ProductsComponent, children: [
          { path: "", component: ListComponent },
          { path: "create", component: CreateComponent },
          { path: "edit/:id", component: UpdateComponent }
        ]
      }
    ]),

    MatSidenavModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatPaginatorModule, MatDialogModule, MatSelectModule,
    DialogModule,
    FileUploadModule,
    DeleteDirectiveModule
  ]
})
export class ProductsModule { }
