import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DiscountCoupon, Create_DiscountCoupon, Update_DiscountCoupon } from 'src/app/contracts/discount-coupon/discount-coupon';
import { DiscountCouponService } from 'src/app/services/common/models/discount-coupon.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base.component';

@Component({
  selector: 'app-discount-coupons',
  templateUrl: './discount-coupons.component.html',
  styleUrls: ['./discount-coupons.component.scss']
})
export class DiscountCouponsComponent implements OnInit {

  coupons: DiscountCoupon[] = [];
  dataSource: MatTableDataSource<DiscountCoupon> = new MatTableDataSource<DiscountCoupon>();
  displayedColumns: string[] = ['code', 'discountType', 'discountValue', 'minCartAmount', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  showForm: boolean = false;
  couponForm: FormGroup;
  isEditMode: boolean = false;
  editingCouponId: string | null = null;

  discountTypes = [
    { value: 'Amount', label: 'Tutar İndirimi (TL)' },
    { value: 'Percentage', label: 'Yüzdelik İndirim (%)' }
  ];

  constructor(
    private discountCouponService: DiscountCouponService,
    private formBuilder: FormBuilder,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.loadCoupons();
  }

  createForm() {
    this.couponForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      discountType: ['Amount', Validators.required],
      discountValue: [null, [Validators.required, Validators.min(1)]],
      minCartAmount: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      expirationDate: [null],
      usageLimit: [null]
    });
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
    this.couponForm.reset({ discountType: 'Amount', minCartAmount: 0, isActive: true });
    this.showForm = true;
  }

  openEditForm(coupon: DiscountCoupon) {
    this.isEditMode = true;
    this.editingCouponId = coupon.id;
    this.couponForm.patchValue({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minCartAmount: coupon.minCartAmount,
      isActive: coupon.isActive,
      expirationDate: coupon.expirationDate,
      usageLimit: coupon.usageLimit
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.couponForm.reset();
  }

  async submitForm() {
    if (this.couponForm.invalid) {
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
