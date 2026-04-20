import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from '../../base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../services/ui/custom-toastr.service';
import { BaseDialog } from '../base/base-dialog';

declare var $: any;

@Component({
  selector: 'app-qrcode-reading-dialog',
  templateUrl: './qrcode-reading-dialog.component.html'
})
export class QrcodeReadingDialogComponent extends BaseDialog<QrcodeReadingDialogComponent> implements OnInit, OnDestroy {

  constructor(
    dialogRef: MatDialogRef<QrcodeReadingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private spinner: NgxSpinnerService,
    private toastrService: CustomToastrService,
    private router: Router) {
    super(dialogRef)
  }

  @ViewChild("scanner", { static: true }) scanner: NgxScannerQrcodeComponent;

  ngOnInit(): void {
    this.scanner.start();
  }

  ngOnDestroy(): void {
    this.scanner.stop();
  }

  onEvent(e) {
    this.spinner.show(SpinnerType.BallAtom)
    const data: any = (e as { data: string }).data;
    if (data != null && data != "") {
      try {
        const jsonData = JSON.parse(data);
        const productId = jsonData.Id || jsonData.id;

        if (productId) {
          this.spinner.hide(SpinnerType.BallAtom);
          this.close(); // Close dialog
          this.router.navigate([`/admin/products/edit/${productId}`]);
          
          this.toastrService.message(`${jsonData.Name || 'Ürün'} başarıyla bulundu. Düzenleme sayfasına yönlendiriliyorsunuz.`, "Ürün Bulundu", {
            messageType: ToastrMessageType.Info,
            position: ToastrPosition.TopRight
          });
        }
      } catch (error) {
        this.spinner.hide(SpinnerType.BallAtom);
        this.toastrService.message("QR Kod geçersiz veya ürün bilgisi okunamadı.", "Hata", {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    }
  }
}
