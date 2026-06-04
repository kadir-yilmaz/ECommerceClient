import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RewardRule, Create_RewardRule, Update_RewardRule } from 'src/app/contracts/reward-rule/reward-rule';
import { RewardRuleService } from 'src/app/services/common/models/reward-rule.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base.component';
import { MatDialog } from '@angular/material/dialog';
import { RewardCouponDialogComponent, RewardCouponData } from './reward-coupon-dialog/reward-coupon-dialog.component';

@Component({
  selector: 'app-reward-rules',
  templateUrl: './reward-rules.component.html',
  styleUrls: ['./reward-rules.component.scss']
})
export class RewardRulesComponent implements OnInit {

  rules: RewardRule[] = [];
  dataSource: MatTableDataSource<RewardRule> = new MatTableDataSource<RewardRule>();
  displayedColumns: string[] = ['name', 'minTotalSpent', 'periodInDays', 'rewardDiscount', 'isActive', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  showForm: boolean = false;
  ruleForm: FormGroup;
  isEditMode: boolean = false;
  editingRuleId: string | null = null;
  formSubmitted: boolean = false;

  constructor(
    private rewardRuleService: RewardRuleService,
    private formBuilder: FormBuilder,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.loadRules();
  }

  createForm() {
    this.ruleForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      minTotalSpent: [0, [Validators.required, Validators.min(1)]],
      periodInDays: [30, [Validators.required, Validators.min(1)]],
      rewardDiscountType: ['Amount', [Validators.required]],
      rewardDiscountValue: [0, [Validators.required, Validators.min(0)]],
      rewardMaxDiscountAmount: [null],
      couponValidityDays: [30, [Validators.required, Validators.min(1)]],
      couponMinCartAmount: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  async loadRules() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      this.rules = await this.rewardRuleService.getAllRewardRules();
      this.dataSource = new MatTableDataSource<RewardRule>(this.rules);
      this.dataSource.paginator = this.paginator;
    } catch (error) {
      this.toastrService.message("Kurallar yüklenirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  openAddForm() {
    this.isEditMode = false;
    this.editingRuleId = null;
    this.formSubmitted = false;
    this.ruleForm.reset({ minTotalSpent: 0, periodInDays: 30, rewardDiscountType: 'Amount', rewardDiscountValue: 0, rewardMaxDiscountAmount: null, couponValidityDays: 30, couponMinCartAmount: 0, isActive: true });
    this.showForm = true;
  }

  openEditForm(rule: RewardRule) {
    this.isEditMode = true;
    this.editingRuleId = rule.id;
    this.formSubmitted = false;
    this.ruleForm.patchValue({
      name: rule.name,
      minTotalSpent: rule.minTotalSpent,
      periodInDays: rule.periodInDays,
      rewardDiscountType: rule.rewardDiscountType,
      rewardDiscountValue: rule.rewardDiscountValue,
      rewardMaxDiscountAmount: rule.rewardMaxDiscountAmount,
      couponValidityDays: rule.couponValidityDays,
      couponMinCartAmount: rule.couponMinCartAmount,
      isActive: rule.isActive
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.formSubmitted = false;
    this.ruleForm.reset();
  }

  openCouponDialog() {
    const currentData: RewardCouponData = {
      discountType: this.ruleForm.get('rewardDiscountType')?.value || 'Amount',
      discountValue: this.ruleForm.get('rewardDiscountValue')?.value || 0,
      maxDiscountAmount: this.ruleForm.get('rewardMaxDiscountAmount')?.value,
      minCartAmount: this.ruleForm.get('couponMinCartAmount')?.value || 0,
      validityDays: this.ruleForm.get('couponValidityDays')?.value || 30
    };

    const dialogRef = this.dialog.open(RewardCouponDialogComponent, {
      width: '500px',
      data: currentData
    });

    dialogRef.afterClosed().subscribe((result: RewardCouponData) => {
      if (result) {
        this.ruleForm.patchValue({
          rewardDiscountType: result.discountType,
          rewardDiscountValue: result.discountValue,
          rewardMaxDiscountAmount: result.maxDiscountAmount,
          couponMinCartAmount: result.minCartAmount,
          couponValidityDays: result.validityDays
        });
      }
    });
  }

  async submitForm() {
    this.formSubmitted = true;

    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      this.toastrService.message("Lütfen zorunlu alanları doldurun.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.spinner.show(SpinnerType.BallAtom);
    try {
      const formData = this.ruleForm.value;

      if (this.isEditMode && this.editingRuleId) {
        const updateModel: Update_RewardRule = {
          id: this.editingRuleId,
          ...formData
        };
        await this.rewardRuleService.updateRewardRule(updateModel);
        this.toastrService.message("Kural güncellendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        const createModel: Create_RewardRule = {
          ...formData
        };
        await this.rewardRuleService.createRewardRule(createModel);
        this.toastrService.message("Kural eklendi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }

      this.showForm = false;
      this.formSubmitted = false;
      await this.loadRules();
    } catch (error) {
      this.toastrService.message("Bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  async deleteRule(id: string) {
    if (confirm("Bu kuralı silmek istediğinize emin misiniz?")) {
      this.spinner.show(SpinnerType.BallAtom);
      try {
        await this.rewardRuleService.deleteRewardRule(id);
        this.toastrService.message("Kural silindi.", "Başarılı", {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        await this.loadRules();
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
