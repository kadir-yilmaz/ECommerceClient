import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Campaign } from 'src/app/contracts/campaign/campaign';
import { CampaignService } from 'src/app/services/common/models/campaign.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { BaseUrl } from 'src/app/contracts/base_url';
import { List_Product } from 'src/app/contracts/list_product';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-campaign-detail',
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.scss']
})
export class CampaignDetailComponent extends BaseComponent implements OnInit {
  campaign: Campaign;
  product: List_Product;
  baseUrl: BaseUrl;

  constructor(
    spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private productService: ProductService,
    private fileService: FileService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.campaign = await this.campaignService.getCampaignById(id);
        if (this.campaign.productId) {
          this.product = await this.productService.readById(this.campaign.productId);
        }
      } else {
        this.router.navigate(['/']);
      }
    } catch (error) {
      this.toastrService.message("Kampanya bulunamadı veya bir hata oluştu.", "Hata", {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  goToProduct(): void {
    if (this.campaign && this.campaign.productId) {
      this.router.navigate(['/products/detail', this.campaign.productId]);
    }
  }
}
