import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { List_Role } from '../../../../contracts/role/List_Role';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { ApplicationService } from '../../../../services/common/models/application.service';
import { AuthorizationEndpointService } from '../../../../services/common/models/authorization-endpoint.service';
import { RoleService } from '../../../../services/common/models/role.service';

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
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent extends BaseComponent implements OnInit {
  roleName: string;
  hasChanges: boolean = false;

  constructor(
    spinner: NgxSpinnerService,
    private applicationService: ApplicationService,
    private authorizationEndpointService: AuthorizationEndpointService,
    private roleService: RoleService,
    private alertifyService: AlertifyService,
    public dialogRef: MatDialogRef<EditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role: List_Role }
  ) {
    super(spinner);
    this.roleName = data.role.name;
  }

  async ngOnInit() {
    await this.loadEndpoints();
    await this.loadEndpointsForRole();
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

      // Expand all nodes by default
      this.treeControl.dataNodes?.forEach(node => {
        if (node.expandable) {
          this.treeControl.expand(node);
        }
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
    this.showSpinner(SpinnerType.BallAtom);

    try {
      const data = this.dataSource.data;
      for (const menu of data) {
        if (menu.actions) {
          for (const action of menu.actions) {
            if (action.code && action.menuName) {
              const roles = await this.authorizationEndpointService.getRolesToEndpoint(
                action.code,
                action.menuName
              );
              action.selected = roles.includes(this.roleName);
            }
          }
        }
      }

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

  onCheckboxChange(node: ExampleFlatNode) {
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

  async save() {
    if (!this.roleName || this.roleName.trim() === '') {
      this.alertifyService.message('Rol adı boş olamaz', {
        messageType: MessageType.Warning,
        position: Position.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);

    try {
      // Update role name if changed
      if (this.roleName !== this.data.role.name) {
        await this.roleService.updateRole(this.data.role.id, this.roleName);
      }

      // Update permissions
      const data = this.dataSource.data;
      for (const menu of data) {
        if (menu.actions) {
          for (const action of menu.actions) {
            if (!action.code || !action.menuName) continue;

            const existingRoles = await this.authorizationEndpointService.getRolesToEndpoint(
              action.code,
              action.menuName
            );

            let updatedRoles = [...existingRoles];
            
            if (action.selected) {
              if (!updatedRoles.includes(this.roleName)) {
                updatedRoles.push(this.roleName);
              }
            } else {
              updatedRoles = updatedRoles.filter(r => r !== this.roleName && r !== this.data.role.name);
            }

            await this.authorizationEndpointService.assignRoleEndpoint(
              updatedRoles,
              action.code,
              action.menuName
            );
          }
        }
      }

      this.alertifyService.message('Rol başarıyla güncellendi', {
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
      
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving role:', error);
      this.alertifyService.message('Rol güncellenirken hata oluştu', {
        messageType: MessageType.Error,
        position: Position.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  cancel() {
    this.dialogRef.close(false);
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
