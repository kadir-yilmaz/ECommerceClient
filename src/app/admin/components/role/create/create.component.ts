import { Component, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from '../../../../base/base.component';
import { AlertifyService, MessageType, Position } from '../../../../services/admin/alertify.service';
import { RoleService } from '../../../../services/common/models/role.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent extends BaseComponent implements OnInit {

  roleName: string = '';
  submitted: boolean = false;

  constructor(spiner: NgxSpinnerService,
    private roleService: RoleService,
    private alertify: AlertifyService) {
    super(spiner)
  }

  ngOnInit(): void {
  }

  @Output() createdRole: EventEmitter<string> = new EventEmitter();

  /**
   * Rol adı doğrulaması — IdentityRole Name string (non-nullable)
   * Min 2, max 50 karakter.
   */
  getNameError(): string | null {
    const name = this.roleName?.trim() || '';
    if (!name) return 'Rol adı zorunludur.';
    if (name.length < 2) return 'Rol adı en az 2 karakter olmalıdır.';
    if (name.length > 50) return 'Rol adı en fazla 50 karakter olabilir.';
    return null;
  }

  create(name: HTMLInputElement) {
    this.submitted = true;

    const error = this.getNameError();
    if (error) {
      this.alertify.message(error, {
        dismissOthers: true,
        messageType: MessageType.Warning,
        position: Position.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);

    this.roleService.create(this.roleName.trim(), () => {
      this.hideSpinner(SpinnerType.BallAtom);
      this.alertify.message("Rol başarıyla eklenmiştir.", {
        dismissOthers: true,
        messageType: MessageType.Success,
        position: Position.BottomRight
      });
      this.createdRole.emit(this.roleName.trim());
    }, errorMessage => {
      this.hideSpinner(SpinnerType.BallAtom);
      this.alertify.message(errorMessage,
        {
          dismissOthers: true,
          messageType: MessageType.Error,
          position: Position.BottomRight
        });
    });
  }
}
