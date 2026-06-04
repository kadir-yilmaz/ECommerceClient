import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignsComponent } from './campaigns.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    CampaignsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild([
      { path: "", component: CampaignsComponent }
    ])
  ]
})
export class CampaignsModule { }
