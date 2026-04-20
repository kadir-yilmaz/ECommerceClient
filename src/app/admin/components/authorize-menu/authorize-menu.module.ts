import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorizeMenuComponent } from './authorize-menu.component';
import { RouterModule } from '@angular/router';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [
    AuthorizeMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: "", component: AuthorizeMenuComponent }
    ]),
    MatTreeModule, 
    MatIconModule, 
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule
  ]
})
export class AuthorizeMenuModule { }
