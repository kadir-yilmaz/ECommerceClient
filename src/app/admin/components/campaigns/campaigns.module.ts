import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CampaignsRoutingModule } from './campaigns-routing.module';
import { CampaignsComponent } from './campaigns.component';
import { FileUploadModule } from 'src/app/services/common/file-upload/file-upload.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DialogModule } from 'src/app/dialogs/dialog.module';


@NgModule({
  declarations: [
    CampaignsComponent
  ],
  imports: [
    CommonModule,
    CampaignsRoutingModule,
    FileUploadModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DialogModule
  ]
})
export class CampaignsModule { }
