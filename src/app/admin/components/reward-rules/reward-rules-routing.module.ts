import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RewardRulesComponent } from './reward-rules.component';

const routes: Routes = [
  { path: '', component: RewardRulesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RewardRulesRoutingModule { }
