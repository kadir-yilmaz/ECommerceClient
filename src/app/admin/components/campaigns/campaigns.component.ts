import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { CampaignImage, CampaignService } from 'src/app/services/common/models/campaign.service';
import { FileUploadOptions } from 'src/app/services/common/file-upload/file-upload.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent extends BaseComponent implements OnInit {

  fileUploadOptions: Partial<FileUploadOptions> = {
    action: "Upload",
    controller: "campaigns",
    explanation: "Kampanya resimlerini seçin veya buraya sürükleyin...",
    isAdminPage: true,
    accept: ".png, .jpg, .jpeg, .gif, .webp"
  };

  campaignImages: CampaignImage[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private campaignService: CampaignService,
    private customToastrService: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.getCampaignImages();
  }

  async getCampaignImages() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.campaignImages = await this.campaignService.getCampaignImages();
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async deleteImage(id: string) {
    if (confirm("Bu kampanya resmini silmek istediğinize emin misiniz?")) {
      this.showSpinner(SpinnerType.BallAtom);
      try {
        await this.campaignService.deleteCampaignImage(id);
        this.customToastrService.message('Kampanya resmi başarıyla silindi.', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
        await this.getCampaignImages();
      } catch {
        this.customToastrService.message('Kampanya resmi silinemedi.', 'Hata', {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.BottomRight
        });
      } finally {
        this.hideSpinner(SpinnerType.BallAtom);
      }
    }
  }

  editingImageId: string | null = null;
  editingImageTitle: string = '';

  openEditModal(image: CampaignImage) {
    this.editingImageId = image.id;
    this.editingImageTitle = image.title || '';
  }

  cancelEdit() {
    this.editingImageId = null;
    this.editingImageTitle = '';
  }

  async saveEdit(newTitle: string) {
    if (this.editingImageId) {
      await this.updateTitle(this.editingImageId, newTitle);
      this.cancelEdit();
    }
  }

  async updateTitle(id: string, title: string) {
    if (!title || title.trim() === '') {
      this.customToastrService.message('Lütfen bir başlık giriniz.', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.campaignService.updateCampaignImageTitle(id, title);
      this.customToastrService.message('Başlık başarıyla güncellendi.', 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
      await this.getCampaignImages();
    } catch {
      this.customToastrService.message('Başlık güncellenemedi.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }
}
