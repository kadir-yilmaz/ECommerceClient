import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../services/common/auth.service';
import { UserAuthService } from '../../../../services/common/models/user-auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  authorizedMenus: string[] = [];

  constructor(
    public authService: AuthService,
    private userAuthService: UserAuthService
  ) { }

  async ngOnInit() {
    try {
      this.authorizedMenus = await this.userAuthService.getAuthorizedMenus();
    } catch (error) {
      console.error('Error loading authorized menus:', error);
      this.authorizedMenus = [];
    }
  }

  hasMenuAccess(menuName: string): boolean {
    return this.authorizedMenus.includes(menuName);
  }

}
