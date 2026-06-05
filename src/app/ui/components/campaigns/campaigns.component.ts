import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Campaign } from 'src/app/contracts/campaign/campaign';
import { CampaignService } from 'src/app/services/common/models/campaign.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { FileService } from 'src/app/services/common/models/file.service';
import { BaseUrl } from 'src/app/contracts/base_url';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent extends BaseComponent implements OnInit {
  activeCampaigns: Campaign[] = [];
  baseUrl: BaseUrl;

  constructor(
    spinner: NgxSpinnerService,
    private campaignService: CampaignService,
    private productService: ProductService,
    private fileService: FileService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      this.baseUrl = await this.fileService.getBaseStorageUrl();
      const allActive = await this.campaignService.getActiveCampaigns();
      
      this.activeCampaigns = await Promise.all(allActive.filter(c => c.ruleType !== 'FreeShipping').map(async (c) => {
        if (c.productId && !c.productId.includes(',')) {
          try {
            const p = await this.productService.readById(c.productId);
            if (p) {
              p.imagePath = p.productImageFiles?.length
                ? (p.productImageFiles.find(img => img.showcase)?.path ?? p.productImageFiles[0].path)
                : '';
              return { ...c, product: p };
            }
          } catch (e) {
            console.error('Error fetching product for campaign:', e);
          }
        }
        return c;
      }));
    } catch (error) {
      console.error('Error loading campaigns list:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  getProductImage(path?: string): string {
    if (!path) return '../../../../../assets/default-product.png';
    const normalizedPath = path.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    const sanitizedBaseUrl = (this.baseUrl?.url ?? '').replace(/\/+$/, '');
    if (!sanitizedBaseUrl) return normalizedPath;
    if (normalizedPath.startsWith('/')) return `${sanitizedBaseUrl}${normalizedPath}`;
    return `${sanitizedBaseUrl}/${normalizedPath}`;
  }
}
