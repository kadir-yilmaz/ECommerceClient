import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CampaignDetailRoutingModule } from './campaign-detail-routing.module';
import { CampaignDetailComponent } from './campaign-detail.component';
import { MatIconModule } from '@angular/material/icon';
import { SharedUiModule } from '../shared/shared-ui.module';

@NgModule({
  declarations: [
    CampaignDetailComponent
  ],
  imports: [
    CommonModule,
    CampaignDetailRoutingModule,
    MatIconModule,
    SharedUiModule
  ]
})
export class CampaignDetailModule { }
