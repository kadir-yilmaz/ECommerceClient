import { Component, OnInit } from '@angular/core';
import { Campaign, Create_Campaign, Update_Campaign } from 'src/app/contracts/campaign/campaign';
import { CampaignService } from 'src/app/services/common/models/campaign.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base.component';

@Component({
  selector: 'app-shippings',
  templateUrl: './shippings.component.html',
  styleUrls: ['./shippings.component.scss']
})
export class ShippingsComponent implements OnInit {

  freeShippingCampaign: Campaign | null = null;
  shippingThreshold: number = 100;
  shippingFee: number = 50;
  isShippingActive: boolean = true;

  constructor(
    private campaignService: CampaignService,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadShippingRule();
  }

  async loadShippingRule() {
    this.spinner.show(SpinnerType.BallAtom);
    try {
      const allCampaigns = await this.campaignService.getAllCampaigns();
      this.freeShippingCampaign = allCampaigns.find(c => c.ruleType === 'FreeShipping') || null;
      if (this.freeShippingCampaign) {
        this.shippingThreshold = this.freeShippingCampaign.minAmount || 100;
        this.isShippingActive = this.freeShippingCampaign.isActive;
        this.shippingFee = this.freeShippingCampaign.discountRate || 50;
      } else {
        this.shippingThreshold = 100;
        this.isShippingActive = true;
        this.shippingFee = 50;
      }
    } catch (error) {
      this.toastrService.message("Kargo ayarları yüklenirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }

  async saveShippingRule() {
    if (this.shippingThreshold == null || this.shippingThreshold < 0) {
      this.toastrService.message("Lütfen geçerli bir minimum tutar giriniz.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    if (this.shippingFee == null || this.shippingFee < 0) {
      this.toastrService.message("Lütfen geçerli bir kargo ücreti giriniz.", "Uyarı", {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      return;
    }

    this.spinner.show(SpinnerType.BallAtom);
    try {
      if (this.freeShippingCampaign) {
        const updateModel: Update_Campaign = {
          id: this.freeShippingCampaign.id,
          name: 'Kargo Bedava',
          description: `${this.shippingThreshold} TL ve üzeri alışverişlerde kargo bedava!`,
          ruleType: 'FreeShipping',
          minAmount: this.shippingThreshold,
          discountRate: this.shippingFee,
          isActive: this.isShippingActive
        };
        await this.campaignService.updateCampaign(updateModel);
      } else {
        const createModel: Create_Campaign = {
          name: 'Kargo Bedava',
          description: `${this.shippingThreshold} TL ve üzeri alışverişlerde kargo bedava!`,
          ruleType: 'FreeShipping',
          minAmount: this.shippingThreshold,
          discountRate: this.shippingFee,
          isActive: this.isShippingActive
        };
        await this.campaignService.createCampaign(createModel);
      }
      this.toastrService.message("Kargo kuralı başarıyla kaydedildi.", "Başarılı", {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadShippingRule();
    } catch (error) {
      this.toastrService.message("Kargo kuralı kaydedilirken hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallAtom);
    }
  }
}
