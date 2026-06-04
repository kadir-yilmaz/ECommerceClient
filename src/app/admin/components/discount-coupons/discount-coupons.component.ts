import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DiscountCoupon, Create_DiscountCoupon, Update_DiscountCoupon } from 'src/app/contracts/discount-coupon/discount-coupon';
import { DiscountCouponService } from 'src/app/services/common/models/discount-coupon.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base.component';
import { AssignCouponDialogComponent } from './assign-coupon-dialog/assign-coupon-dialog.component';
import { UserService } from 'src/app/services/common/models/user.service';
import { List_User } from 'src/app/contracts/users/list_user';
import { CouponUsersDialogComponent } from './coupon-users-dialog/coupon-users-dialog.component';

@Component({
  selector: 'app-discount-coupons',
  templateUrl: './discount-coupons.component.html',
  styleUrls: ['./discount-coupons.component.scss']
})
export class DiscountCouponsComponent implements OnInit {

  coupons: DiscountCoupon[] = [];
  dataSource: MatTableDataSource<DiscountCoupon> = new MatTableDataSource<DiscountCoupon>();
  displayedColumns: string[] = ['code', 'scope', 'discountType', 'discountValue', 'minCartAmount', 'expiration', 'users', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  showForm: boolean = false;
  couponForm: FormGroup;
  isEditMode: boolean = false;
  editingCouponId: string | null = null;
  formSubmitted: boolean = false;
  
  users: List_User[] = [];

  discountTypes = [
    { value: 'Amount', label: 'Tutar İndirimi (TL)' },
    { value: 'Percentage', label: 'Yüzdelik İndirim (%)' },
    { value: 'FreeShipping', label: 'Kargo Bedava' }
  ];

  scopes = [
    { value: 'Public', label: 'Herkese Açık' },
    { value: 'Private', label: 'Kişiye Özel' }
  ];

  constructor(
    private discountCouponService: DiscountCouponService,
    private formBuilder: FormBuilder,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.loadCoupons();
    this.loadUsers();
  }

  async loadUsers() {
    try {
      // 0 page, 1000 size for simplicity to get all active users to assign
      const response = await this.userService.getAllUsers(0, 1000);
      this.users = response.users;
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu", error);
    }
  }

  createForm() {
    this.couponForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      discountType: ['Amount', Validators.required],
      discountValue: [null],
      maxDiscountAmount: [null, [Validators.min(1)]],
      minCartAmount: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      expirationDate: [null],
      scope: ['Public', Validators.required],
      userIds: [[]]
    });

    // DiscountType değiştiğinde discountValue max validatorünü güncelle
    this.couponForm.get('discountType')?.valueChanges.subscribe(type => {
      this.updateDiscountValueValidators(type);
    });

    // Kupon kodu alanındaki tüm girişleri büyük harfe dönüştür
    this.couponForm.get('code')?.valueChanges.subscribe(value => {
      const upper = (value || '').toString().toUpperCase();
      if (value !== upper) {
        this.couponForm.get('code')?.setValue(upper, { emitEvent: false });
      }
    });

    // scope değiştiğinde userIds validatorü (Private ise zorunlu olabilir, ama şimdilik en az 1 kişi seçilmesi UI'da zorunlu yapılabilir)
    this.couponForm.get('scope')?.valueChanges.subscribe(scope => {
      const userIdsControl = this.couponForm.get('userIds');
      if (scope === 'Private') {
        userIdsControl?.setValidators([Validators.required]);
      } else {
        userIdsControl?.clearValidators();
        userIdsControl?.setValue([]);
      }
      userIdsControl?.updateValueAndValidity();
    });
  }

  /**
   * İndirim tipine göre validatorleri güncelle
   */
  updateDiscountValueValidators(type: string) {
    const discountValue = this.couponForm.get('discountValue');
    const maxDiscountAmount = this.couponForm.get('maxDiscountAmount');

    if (type === 'FreeShipping') {
      discountValue?.clearValidators();
      discountValue?.setValue(0);
      maxDiscountAmount?.clearValidators();
      maxDiscountAmount?.setValue(null);
    } else if (type === 'Percentage') {
      discountValue?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      maxDiscountAmount?.setValidators([Validators.min(1)]);
    } else {
      discountValue?.setValidators([Validators.required, Validators.min(1)]);
      maxDiscountAmount?.clearValidators();
      maxDiscountAmount?.setValue(null);
    }
    discountValue?.updateValueAndValidity();
    maxDiscountAmount?.updateValueAndValidity();
  }

  /**
   * Geçmiş tarih kontrolü — expirationDate girilmişse bugünden sonra olmalı
   */
  isExpirationDateInPast(): boolean {
    const date = this.couponForm.get('expirationDate')?.value;
    if (!date) return false;
    const expDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  }

  async loadCoupons() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      this.coupons = await this.discountCouponService.getAllDiscountCoupons();
      this.dataSource = new MatTableDataSource<DiscountCoupon>(this.coupons);
      this.dataSource.paginator = this.paginator;
    } catch (error) {
      this.toastrService.message("Kuponlar yüklenirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingCouponId = null;
    this.formSubmitted = false;
    this.couponForm.reset({ discountType: 'Amount', minCartAmount: 0, isActive: true, scope: 'Public', discountValue: null, maxDiscountAmount: null, userIds: [] });
    this.showForm = true;
  }

  openEditForm(coupon: DiscountCoupon) {
    this.isEditMode = true;
    this.editingCouponId = coupon.id;
    this.formSubmitted = false;
    this.couponForm.patchValue({
      code: coupon.code?.toUpperCase(),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minCartAmount: coupon.minCartAmount,
      isActive: coupon.isActive,
      expirationDate: coupon.expirationDate,
      scope: coupon.scope
    });
    // discountType'a göre validatorleri güncelle
    this.updateDiscountValueValidators(coupon.discountType);
    this.showForm = true;
  }

  openAssignDialog(coupon: DiscountCoupon) {
    const dialogRef = this.dialog.open(AssignCouponDialogComponent, {
      width: '500px',
      data: { couponId: coupon.id, couponCode: coupon.code }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // İsteğe bağlı olarak table yenilenebilir
      }
    });
  }

  openUsersDialog(coupon: DiscountCoupon) {
    this.dialog.open(CouponUsersDialogComponent, {
      width: '500px',
      data: { couponCode: coupon.code, users: coupon.assignedUsers || [] }
    });
  }

  getExpirationText(expirationDate: Date | string | null): string {
    if (!expirationDate) return 'Süresiz';
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    
    if (diffTime < 0) return 'Süresi Doldu';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Bugün Son';
    return `${diffDays} gün kaldı`;
  }

  getExpirationColor(expirationDate: Date | string | null): string {
    if (!expirationDate) return '#2e7d32'; // Green for unlimited
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    
    if (diffTime < 0) return '#d32f2f'; // Red for expired
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return '#ed6c02'; // Orange if expiring soon
    return '#2e7d32'; // Green otherwise
  }

  cancelForm() {
    this.showForm = false;
    this.formSubmitted = false;
    this.couponForm.reset();
  }

  async submitForm() {
    this.formSubmitted = true;

    // Geçmiş tarih kontrolü
    if (this.isExpirationDateInPast()) {
      this.toastrService.message("Son kullanma tarihi geçmiş bir tarih olamaz.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      this.toastrService.message("Lütfen zorunlu alanları doldurun.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.spinner.show(SpinnerType.BallAtom);
    try {
      const formData = this.couponForm.value;

      if (this.isEditMode && this.editingCouponId) {
        const updateModel: Update_DiscountCoupon = {
          id: this.editingCouponId,
          ...formData
        };
        await this.discountCouponService.updateDiscountCoupon(updateModel);
        this.toastrService.message("Kupon güncellendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        const createModel: Create_DiscountCoupon = {
          ...formData
        };
        await this.discountCouponService.createDiscountCoupon(createModel);
        this.toastrService.message("Kupon eklendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }

      this.showForm = false;
      this.formSubmitted = false;
      await this.loadCoupons();
    } catch (error) {
      this.toastrService.message("Bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  async deleteCoupon(id: string) {
    if (confirm("Bu kuponu silmek istediğinize emin misiniz?")) {
      this.spinner.show(SpinnerType.BallAtom);
      try {
        await this.discountCouponService.deleteDiscountCoupon(id);
        this.toastrService.message("Kupon silindi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        await this.loadCoupons();
      } catch (error) {
        this.toastrService.message("Silinirken hata oluştu.", "Hata", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      } finally {
        this.spinner.hide(SpinnerType.BallAtom);
      }
    }
  }
}
