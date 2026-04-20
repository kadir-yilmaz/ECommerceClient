import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { List_Basket_Item } from 'src/app/contracts/basket/list_basket_item';
import { Create_Order } from 'src/app/contracts/order/create_order';
import { BasketService } from 'src/app/services/common/models/basket.service';
import { OrderService } from 'src/app/services/common/models/order.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent extends BaseComponent implements OnInit {
  checkoutForm: UntypedFormGroup;
  basketItems: List_Basket_Item[] = [];
  submitted = false;
  isSubmitting = false;
  serverValidationErrors: { [key: string]: string[] } = {};

  readonly paymentMonths = Array.from({ length: 12 }, (_, index) => `${index + 1}`.padStart(2, '0'));
  readonly paymentYears = Array.from({ length: 12 }, (_, index) => `${new Date().getFullYear() + index}`);

  constructor(
    spinner: NgxSpinnerService,
    private formBuilder: UntypedFormBuilder,
    private basketService: BasketService,
    private orderService: OrderService,
    private toastrService: CustomToastrService,
    private router: Router
  ) {
    super(spinner);
  }

  get totalPrice(): number {
    return this.basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get itemCount(): number {
    return this.basketItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get f() {
    return this.checkoutForm.controls;
  }

  get cardPreviewNumber(): string {
    const value = (this.f['cardNumber']?.value ?? '').replace(/\D/g, '');
    const padded = `${value}${'•'.repeat(Math.max(0, 16 - value.length))}`.slice(0, 16);
    return padded.match(/.{1,4}/g)?.join(' ') ?? '•••• •••• •••• ••••';
  }

  get cardPreviewName(): string {
    return this.f['cardHolderName']?.value || 'KART SAHIBI';
  }

  get cardPreviewExpiry(): string {
    const month = this.f['expireMonth']?.value || 'AA';
    const yearValue = this.f['expireYear']?.value;
    const year = yearValue ? yearValue.toString().slice(-2) : 'YY';
    return `${month}/${year}`;
  }

  async ngOnInit(): Promise<void> {
    this.buildForm();
    await this.loadBasket();
  }

  private buildForm(): void {
    this.checkoutForm = this.formBuilder.group({
      contactName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      city: ['', [Validators.required, Validators.maxLength(60)]],
      district: ['', [Validators.required, Validators.maxLength(60)]],
      neighborhood: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      addressLine: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      description: ['', [Validators.maxLength(300)]],
      cardHolderName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/), this.luhnValidator()]],
      expireMonth: ['', [Validators.required]],
      expireYear: ['', [Validators.required]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
    }, {
      validators: [this.futureExpiryValidator()]
    });
  }

  private async loadBasket(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);

    try {
      this.basketItems = await this.basketService.get();

      if (!this.basketItems.length) {
        this.toastrService.message('Odeme adimi icin once sepetinizde urun olmali.', 'Sepet Bos', {
          messageType: ToastrMessageType.Warning,
          position: ToastrPosition.BottomRight
        });
        this.router.navigate(['/basket']);
      }
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  onCardNumberInput(): void {
    const digits = (this.f['cardNumber'].value ?? '').replace(/\D/g, '').slice(0, 16);
    this.f['cardNumber'].setValue(digits, { emitEvent: false });
  }

  onPhoneNumberInput(): void {
    const digits = (this.f['phoneNumber'].value ?? '').replace(/\D/g, '').slice(0, 11);
    this.f['phoneNumber'].setValue(digits, { emitEvent: false });
  }

  onPostalCodeInput(): void {
    const digits = (this.f['postalCode'].value ?? '').replace(/\D/g, '').slice(0, 5);
    this.f['postalCode'].setValue(digits, { emitEvent: false });
  }

  onCvvInput(): void {
    const digits = (this.f['cvv'].value ?? '').replace(/\D/g, '').slice(0, 3);
    this.f['cvv'].setValue(digits, { emitEvent: false });
  }

  async completeOrder(): Promise<void> {
    this.submitted = true;
    this.serverValidationErrors = {};

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    this.isSubmitting = true;

    try {
      const formValue = this.checkoutForm.value;
      const order: Create_Order = {
        description: formValue.description?.trim() ?? '',
        contactName: formValue.contactName.trim(),
        phoneNumber: formValue.phoneNumber.trim(),
        city: formValue.city.trim(),
        district: formValue.district.trim(),
        neighborhood: formValue.neighborhood.trim(),
        postalCode: formValue.postalCode.trim(),
        addressLine: formValue.addressLine.trim(),
        cardHolderName: formValue.cardHolderName.trim(),
        cardNumber: formValue.cardNumber.replace(/\D/g, ''),
        expireMonth: formValue.expireMonth,
        expireYear: formValue.expireYear,
        cvv: formValue.cvv
      };

      await this.orderService.create(order);
      this.basketService.clear();

      this.toastrService.message('Siparisiniz alindi. Hazirlaniyor.', 'Siparis Basarili', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });

      this.router.navigate(['/']);
    } catch (error: any) {
      this.serverValidationErrors = this.extractValidationErrors(error);
      this.checkoutForm.markAllAsTouched();
    } finally {
      this.isSubmitting = false;
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  private extractValidationErrors(error: any): { [key: string]: string[] } {
    const validationPayload = error?.error;
    if (!validationPayload || typeof validationPayload !== 'object') {
      return {};
    }

    const errors: { [key: string]: string[] } = {};
    for (const [key, value] of Object.entries(validationPayload)) {
      const fieldName = this.mapServerFieldToFormControl(key);
      errors[fieldName] = Array.isArray(value) ? value : [value as string];
    }
    return errors;
  }

  private mapServerFieldToFormControl(serverField: string): string {
    const mapping: { [key: string]: string } = {
      'ContactName': 'contactName',
      'PhoneNumber': 'phoneNumber',
      'City': 'city',
      'District': 'district',
      'Neighborhood': 'neighborhood',
      'PostalCode': 'postalCode',
      'AddressLine': 'addressLine',
      'CardHolderName': 'cardHolderName',
      'CardNumber': 'cardNumber',
      'ExpireMonth': 'expireMonth',
      'ExpireYear': 'expireYear',
      'Cvv': 'cvv',
      'Description': 'description'
    };
    return mapping[serverField] || serverField.toLowerCase();
  }

  getFieldError(controlName: string): string | null {
    const control = this.f[controlName];
    
    if (this.serverValidationErrors[controlName]?.length) {
      return this.serverValidationErrors[controlName][0];
    }

    if (!control || !this.hasControlError(controlName)) {
      return null;
    }

    const errors = control.errors;
    if (errors?.['required']) return this.getRequiredMessage(controlName);
    if (errors?.['minlength']) return this.getMinLengthMessage(controlName, errors['minlength'].requiredLength);
    if (errors?.['maxlength']) return this.getMaxLengthMessage(controlName, errors['maxlength'].requiredLength);
    if (errors?.['pattern']) return this.getPatternMessage(controlName);
    if (errors?.['luhnInvalid']) return 'Kart numarasi gecersiz gorunuyor.';

    return null;
  }

  private getRequiredMessage(field: string): string {
    const messages: { [key: string]: string } = {
      'contactName': 'Ad soyad zorunlu.',
      'phoneNumber': 'Telefon numarasi zorunlu.',
      'city': 'Il bilgisi zorunlu.',
      'district': 'Ilce bilgisi zorunlu.',
      'neighborhood': 'Mahalle bilgisi zorunlu.',
      'postalCode': 'Posta kodu zorunlu.',
      'addressLine': 'Acik adres zorunlu.',
      'cardHolderName': 'Kart sahibi bilgisi zorunlu.',
      'cardNumber': 'Kart numarasi zorunlu.',
      'expireMonth': 'Son kullanma ayi zorunlu.',
      'expireYear': 'Son kullanma yili zorunlu.',
      'cvv': 'CVV zorunlu.'
    };
    return messages[field] || 'Bu alan zorunlu.';
  }

  private getMinLengthMessage(field: string, minLength: number): string {
    return `En az ${minLength} karakter olmali.`;
  }

  private getMaxLengthMessage(field: string, maxLength: number): string {
    return `En fazla ${maxLength} karakter olabilir.`;
  }

  private getPatternMessage(field: string): string {
    const messages: { [key: string]: string } = {
      'phoneNumber': 'Telefon numarasi 10 veya 11 haneli olmali.',
      'postalCode': 'Posta kodu 5 haneli olmali.',
      'cardNumber': 'Kart numarasi 16 haneli olmali.',
      'cvv': 'CVV 3 haneli olmali.'
    };
    return messages[field] || 'Gecersiz format.';
  }

  private luhnValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').replace(/\D/g, '');
      if (!value) {
        return null;
      }

      let sum = 0;
      let alternate = false;

      for (let i = value.length - 1; i >= 0; i--) {
        let digit = Number(value[i]);
        if (alternate) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        alternate = !alternate;
      }

      return sum % 10 === 0 ? null : { luhnInvalid: true };
    };
  }

  private futureExpiryValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const monthValue = group.get('expireMonth')?.value;
      const yearValue = group.get('expireYear')?.value;

      if (!monthValue || !yearValue) {
        return null;
      }

      const month = Number(monthValue);
      const year = Number(yearValue);
      const now = new Date();

      if (year < now.getFullYear()) {
        return { expiredCard: true };
      }

      if (year === now.getFullYear() && month < now.getMonth() + 1) {
        return { expiredCard: true };
      }

      return null;
    };
  }

  hasControlError(controlName: string): boolean {
    const control = this.f[controlName];
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }
}
