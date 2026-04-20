import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../base/base.component';
import { Menu } from '../../../contracts/application-configurations/menu';
import { List_Role } from '../../../contracts/role/List_Role';
import { AlertifyService, MessageType, Position } from '../../../services/admin/alertify.service';
import { ApplicationService } from '../../../services/common/models/application.service';
import { AuthorizationEndpointService } from '../../../services/common/models/authorization-endpoint.service';
import { RoleService } from '../../../services/common/models/role.service';

interface ITreeMenu {
  name?: string,
  actions?: ITreeMenu[],
  code?: string,
  menuName?: string,
  selected?: boolean
}

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
  code?: string;
  menuName?: string;
  selected?: boolean;
}

@Component({
  selector: 'app-authorize-menu',
  templateUrl: './authorize-menu.component.html',
  styleUrls: ['./authorize-menu.component.scss']
})
export class AuthorizeMenuComponent extends BaseComponent implements OnInit {
  selectedRole: List_Role | null = null;
  allRoles: List_Role[] = [];
  hasChanges: boolean = false;

  constructor(
    spinner: NgxSpinnerService,
    private applicationService: ApplicationService,
    private authorizationEndpointService: AuthorizationEndpointService,
    private roleService: RoleService,
    private alertifyService: AlertifyService,
    private route: ActivatedRoute
  ) {
    super(spinner)
  }

  async ngOnInit() {
    try {
      // Rolleri yükle
      await this.loadRoles();

      // URL'den rol parametresi varsa seç
      this.route.queryParams.subscribe(params => {
        if (params['roleId'] && params['roleName']) {
          this.selectedRole = {
            id: params['roleId'],
            name: params['roleName']
          };
          this.loadEndpointsForRole();
        }
      });

      // Endpoint'leri yükle
      await this.loadEndpoints();
    } catch (error) {
      console.error('Error initializing authorize menu:', error);
    }
  }

  async loadRoles() {
    try {
      const result = await this.roleService.getRoles(-1, -1);
      this.allRoles = result.datas;
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }

  async loadEndpoints() {
    this.showSpinner(SpinnerType.BallAtom);
    
    try {
      const menus = await this.applicationService.getAuthorizeDefinitionEndpoints();
      
      this.dataSource.data = menus.map(m => {
        const treeMenu: ITreeMenu = {
          name: m.name,
          actions: m.actions.map(a => {
            const _treeMenu: ITreeMenu = {
              name: a.definition,
              code: a.code,
              menuName: m.name,
              selected: false
            };
            return _treeMenu;
          })
        };
        return treeMenu;
      });
    } catch (error) {
      console.error('Error loading endpoints:', error);
      this.alertifyService.message('Endpoint\'ler yüklenirken hata oluştu', {
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async loadEndpointsForRole() {
    if (!this.selectedRole) return;

    this.showSpinner(SpinnerType.BallAtom);

    try {
      // Her endpoint için rolün yetkisini kontrol et
      const data = this.dataSource.data;
      for (const menu of data) {
        if (menu.actions) {
          for (const action of menu.actions) {
            if (action.code && action.menuName) {
              const roles = await this.authorizationEndpointService.getRolesToEndpoint(
                action.code,
                action.menuName
              );
              action.selected = roles.includes(this.selectedRole.name);
            }
          }
        }
      }

      // Tree'yi güncelle
      this.dataSource.data = [...data];
      this.hasChanges = false;
    } catch (error) {
      console.error('Error loading endpoints for role:', error);
      this.alertifyService.message('Yetkiler yüklenirken hata oluştu', {
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  onRoleChange() {
    this.loadEndpointsForRole();
  }

  onCheckboxChange(node: ExampleFlatNode) {
    // Tree data'sını bul ve güncelle
    const data = this.dataSource.data;
    for (const menu of data) {
      if (menu.actions) {
        const action = menu.actions.find(a => a.code === node.code);
        if (action) {
          action.selected = !action.selected;
          this.hasChanges = true;
          break;
        }
      }
    }
  }

  async saveChanges() {
    if (!this.selectedRole) {
      this.alertifyService.message('Lütfen bir rol seçin', {
        messageType: MessageType.Warning,
        position: Position.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);

    try {
      const data = this.dataSource.data;
      for (const menu of data) {
        if (menu.actions) {
          for (const action of menu.actions) {
            if (!action.code || !action.menuName) continue;

            // Mevcut rolleri al
            const existingRoles = await this.authorizationEndpointService.getRolesToEndpoint(
              action.code,
              action.menuName
            );

            // Yeni rol listesini oluştur
            let updatedRoles = [...existingRoles];
            
            if (action.selected) {
              if (!updatedRoles.includes(this.selectedRole.name)) {
                updatedRoles.push(this.selectedRole.name);
              }
            } else {
              updatedRoles = updatedRoles.filter(r => r !== this.selectedRole.name);
            }

            // Kaydet
            await this.authorizationEndpointService.assignRoleEndpoint(
              updatedRoles,
              action.code,
              action.menuName
            );
          }
        }
      }

      this.hasChanges = false;
      this.alertifyService.message('Yetkiler başarıyla kaydedildi', {
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      this.alertifyService.message('Yetkiler kaydedilirken hata oluştu', {
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  cancelChanges() {
    this.loadEndpointsForRole();
  }

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    (menu: ITreeMenu, level: number) => {
      return {
        expandable: menu.actions?.length > 0,
        name: menu.name,
        level: level,
        code: menu.code,
        menuName: menu.menuName,
        selected: menu.selected
      };
    },
    menu => menu.level,
    menu => menu.expandable,
    menu => menu.actions
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;
}
