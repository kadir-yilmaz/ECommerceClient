import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AddressService } from '../../../../services/common/models/address.service';
import { AddressType } from '../../../../contracts/address/address-type.enum';
import { AddressCategory } from '../../../../contracts/address/address-category.enum';
import { Province } from '../../../../contracts/location/province';
import { District } from '../../../../contracts/location/district';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../../../services/ui/custom-toastr.service';
import locationData from '../../../../../assets/data/il-ilce-mahalle.json';

@Component({
  selector: 'app-address-form',
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss']
})
export class AddressFormComponent implements OnInit {
  @Input() addressType?: AddressType; // Dışardan adres tipi belirlenebilir
  @Input() isModal: boolean = false; // Modal modunda mı?
  @Output() addressCreated = new EventEmitter<void>(); // Adres oluşturulduğunda emit
  @Output() cancelled = new EventEmitter<void>(); // İptal edildiğinde emit

  addressForm!: FormGroup;
  isEditMode = false;
  addressId?: string;
  provinces: Province[] = [];
  districts: District[] = [];
  neighborhoods: string[] = [];

  AddressType = AddressType;
  AddressCategory = AddressCategory;

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: CustomToastrService
  ) { }

  async ngOnInit() {
    this.loadProvinces();
    this.initializeForm();
    
    // Modal modunda değilse, route parametrelerini kontrol et
    if (!this.isModal) {
      this.addressId = this.route.snapshot.paramMap.get('id') || undefined;
      this.isEditMode = !!this.addressId;

      if (this.isEditMode && this.addressId) {
        await this.loadAddress(this.addressId);
      } else {
        const typeParam = this.route.snapshot.queryParamMap.get('type');
        if (typeParam !== null) {
          this.addressForm.patchValue({
            addressType: parseInt(typeParam)
          });
        }
      }
    } else {
      // Modal modunda, input'tan gelen adres tipini kullan
      if (this.addressType !== undefined) {
        this.addressForm.patchValue({
          addressType: this.addressType
        });
      }
    }

    this.setupFormListeners();
  }

  initializeForm() {
    this.addressForm = this.fb.group({
      addressType: [AddressType.Delivery, Validators.required],
      category: [AddressCategory.Home, Validators.required],
      title: ['', Validators.required],
      isDefault: [false],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      province: ['', Validators.required],
      district: ['', Validators.required],
      neighborhood: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      addressDetail: ['', Validators.required],
      closedDays: ['']
    });
  }

  setupFormListeners() {
    this.addressForm.get('province')?.valueChanges.subscribe(provinceName => {
      this.onProvinceChange(provinceName);
    });

    this.addressForm.get('district')?.valueChanges.subscribe(districtName => {
      this.onDistrictChange(districtName);
    });

    this.addressForm.get('category')?.valueChanges.subscribe(category => {
      if (category !== AddressCategory.Workplace) {
        this.addressForm.patchValue({ closedDays: '' });
      }
    });
  }

  loadProvinces() {
    const data = locationData as { [province: string]: { [district: string]: string[] } };
    this.provinces = Object.keys(data).map(provinceName => ({
      name: provinceName,
      districts: Object.keys(data[provinceName]).map(districtName => ({
        name: districtName,
        neighborhoods: data[provinceName][districtName]
      })).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  onProvinceChange(provinceName: string) {
    const province = this.provinces.find(p => p.name === provinceName);
    this.districts = province ? province.districts : [];
    this.neighborhoods = [];
    this.addressForm.patchValue({ district: '', neighborhood: '' });
  }

  onDistrictChange(districtName: string) {
    const district = this.districts.find(d => d.name === districtName);
    this.neighborhoods = district ? district.neighborhoods : [];
    this.addressForm.patchValue({ neighborhood: '' });
  }

  async loadAddress(id: string) {
    this.spinner.show();
    try {
      const address = await this.addressService.getAddressById(id);
      
      // İl seçildiğinde ilçeleri yükle
      const province = this.provinces.find(p => p.name === address.province);
      if (province) {
        this.districts = province.districts;
        
        // İlçe seçildiğinde mahalleleri yükle
        const district = this.districts.find(d => d.name === address.district);
        if (district) {
          this.neighborhoods = district.neighborhoods;
        }
      }

      this.addressForm.patchValue({
        addressType: address.addressType,
        category: address.category,
        title: address.title,
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        phoneNumber: address.phoneNumber,
        province: address.province,
        district: address.district,
        neighborhood: address.neighborhood,
        postalCode: address.postalCode,
        addressDetail: address.addressDetail,
        closedDays: address.closedDays || ''
      });
    } catch (error) {
      this.toastr.message('Adres yüklenirken bir hata oluştu', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.router.navigate(['/addresses']);
    } finally {
      this.spinner.hide();
    }
  }

  async onSubmit() {
    if (this.addressForm.invalid) {
      Object.keys(this.addressForm.controls).forEach(key => {
        this.addressForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.spinner.show();
    try {
      const formValue = this.addressForm.value;

      if (this.isEditMode && this.addressId) {
        await this.addressService.updateAddress({
          id: this.addressId,
          ...formValue
        });
        this.toastr.message('Adres başarıyla güncellendi', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.addressService.createAddress(formValue);
        this.toastr.message('Adres başarıyla eklendi', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }

      // Modal modunda emit, normal modda navigate
      if (this.isModal) {
        this.addressCreated.emit();
      } else {
        this.router.navigate(['/addresses']);
      }
    } catch (error) {
      this.toastr.message(
        this.isEditMode ? 'Adres güncellenirken bir hata oluştu' : 'Adres eklenirken bir hata oluştu',
        'Hata',
        {
          messageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.spinner.hide();
    }
  }

  cancel() {
    if (this.isModal) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/addresses']);
    }
  }

  get f() {
    return this.addressForm.controls;
  }
}
