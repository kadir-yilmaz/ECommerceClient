import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}
