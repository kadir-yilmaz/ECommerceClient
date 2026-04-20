import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent } from '../../../base/base.component';
import { Create_User } from '../../../contracts/users/create_user';
import { User } from '../../../entities/user';
import { UserService } from '../../../services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';
import { Router } from '@angular/router'; // Added Router import

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent extends BaseComponent implements OnInit {

  submitted: boolean = false;
  constructor(private formBuilder: UntypedFormBuilder, private userService: UserService, private router: Router, spinner: NgxSpinnerService, private toastrService: CustomToastrService) {
    super(spinner);
  }

  frm: UntypedFormGroup;

  ngOnInit(): void {
    this.frm = this.formBuilder.group({
      email: ["", [
        Validators.required,
        Validators.maxLength(100),
        Validators.email
      ]],
      password: ["",
        [
          Validators.required,
          Validators.minLength(6)
        ]],
      passwordConfirm: ["",
        [
          Validators.required
        ]]
    }, {
      validators: (group: AbstractControl): ValidationErrors | null => {
        let password = group.get("password").value;
        let passwordConfirm = group.get("passwordConfirm").value;
        return password === passwordConfirm ? null : { notSame: true };
      }
    });

    // Reset form and submitted state when component initializes
    this.submitted = false;
    this.frm.reset();
  }

  get f() {
    return this.frm.controls;
  }

  async onSubmit(user: User) {
    this.submitted = true;

    if (this.frm.invalid) {
      this.toastrService.message('Lütfen tüm alanları doğru şekilde doldurun', 'Form Hatası', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    try {
      const result: Create_User = await this.userService.create(user);
      
      if (result.succeeded) {
        this.toastrService.message(result.message, "Kullanıcı Kaydı Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      } else {
        this.toastrService.message(result.message, "Kayıt Başarısız", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Kayıt işlemi sırasında bir hata oluştu';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = 'Yetkilendirme hatası. Lütfen tekrar deneyin.';
      } else if (error.status === 400) {
        errorMessage = 'Geçersiz bilgiler. Lütfen kontrol edin.';
      }
      
      this.toastrService.message(errorMessage, "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    }
  }
}
