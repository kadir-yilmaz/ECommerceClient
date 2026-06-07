import { Component, OnInit } from '@angular/core';
import { AddressService } from '../../../services/common/models/address.service';
import { Address } from '../../../contracts/address/address';
import { AddressType } from '../../../contracts/address/address-type.enum';
import { AddressCategory } from '../../../contracts/address/address-category.enum';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../services/ui/custom-toastr.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent implements OnInit {
  
  deliveryAddresses: Address[] = [];
  invoiceAddresses: Address[] = [];
  activeTab: AddressType = AddressType.Delivery;
  
  AddressType = AddressType;
  AddressCategory = AddressCategory;

  constructor(
    private addressService: AddressService,
    private spinner: NgxSpinnerService,
    private toastr: CustomToastrService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadAddresses();
  }

  async loadAddresses() {
    this.spinner.show();
    try {
      this.deliveryAddresses = await this.addressService.getUserAddresses(AddressType.Delivery);
      this.invoiceAddresses = await this.addressService.getUserAddresses(AddressType.Invoice);
    } catch (error) {
      this.toastr.message('Adresler yüklenirken bir hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide();
    }
  }

  setActiveTab(tab: AddressType) {
    this.activeTab = tab;
  }

  async setDefault(id: string, type: AddressType) {
    this.spinner.show();
    try {
      await this.addressService.setDefaultAddress(id, type);
      this.toastr.message('Varsayılan adres güncellendi', 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadAddresses();
    } catch (error) {
      this.toastr.message('Varsayılan adres güncellenirken bir hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide();
    }
  }

  async deleteAddress(id: string, type: AddressType) {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) {
      return;
    }

    this.spinner.show();
    try {
      await this.addressService.deleteAddress(id);
      this.toastr.message('Adres başarıyla silindi', 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      await this.loadAddresses();
    } catch (error) {
      this.toastr.message('Adres silinirken bir hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide();
    }
  }

  navigateToCreate(type: AddressType) {
    this.router.navigate(['/addresses/create'], { queryParams: { type } });
  }

  navigateToEdit(id: string) {
    this.router.navigate(['/addresses/edit', id]);
  }

  getCategoryIcon(category: AddressCategory): string {
    return category === AddressCategory.Home ? 'fa-house' : 'fa-building';
  }
}
