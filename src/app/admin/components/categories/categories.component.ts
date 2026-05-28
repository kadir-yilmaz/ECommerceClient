import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Category } from 'src/app/contracts/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent extends BaseComponent implements OnInit {

  categories: Category[] = [];
  categoryTree: any[] = [];

  // Form state
  showForm: boolean = false;
  isEditing: boolean = false;
  formCategoryId: string = '';
  formCategoryName: string = '';
  formParentCategoryId: string = '';

  constructor(
    spinner: NgxSpinnerService,
    private categoryService: CategoryService,
    private toastr: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      const result = await this.categoryService.getAll();
      this.categories = result.categories;
      this.categoryTree = this.buildTree(this.categories);
    } catch {
      this.toastr.message('Kategoriler yüklenemedi.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  buildTree(categories: Category[], parentId: string = null): any[] {
    return categories
      .filter(c => (c.parentCategoryId || null) === parentId)
      .map(c => ({
        ...c,
        children: this.buildTree(categories, c.id),
        expanded: true
      }));
  }

  getParentCategories(): Category[] {
    return this.categories.filter(c => !c.parentCategoryId);
  }

  openAddForm(parentId?: string) {
    this.showForm = true;
    this.isEditing = false;
    this.formCategoryId = '';
    this.formCategoryName = '';
    this.formParentCategoryId = parentId || '';
  }

  openEditForm(category: Category) {
    this.showForm = true;
    this.isEditing = true;
    this.formCategoryId = category.id;
    this.formCategoryName = category.name;
    this.formParentCategoryId = category.parentCategoryId || '';
  }

  cancelForm() {
    this.showForm = false;
    this.formCategoryId = '';
    this.formCategoryName = '';
    this.formParentCategoryId = '';
  }

  async saveCategory() {
    if (!this.formCategoryName.trim()) {
      this.toastr.message('Kategori adı boş olamaz.', 'Uyarı', {
        messageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomRight
      });
      return;
    }

    this.showSpinner(SpinnerType.BallAtom);
    try {
      if (this.isEditing) {
        await this.categoryService.update({
          id: this.formCategoryId,
          name: this.formCategoryName.trim(),
          parentCategoryId: this.formParentCategoryId || undefined
        });
        this.toastr.message('Kategori güncellendi.', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      } else {
        await this.categoryService.create({
          name: this.formCategoryName.trim(),
          parentCategoryId: this.formParentCategoryId || undefined
        });
        this.toastr.message('Kategori oluşturuldu.', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      }
      this.cancelForm();
      // small delay for backend to commit
      setTimeout(() => this.loadCategories(), 300);
    } catch {
      this.toastr.message('İşlem sırasında hata oluştu.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  async deleteCategory(id: string) {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.categoryService.delete(id);
      this.toastr.message('Kategori silindi.', 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
      await this.loadCategories();
    } catch {
      this.toastr.message('Kategori silinemedi.', 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  toggleExpand(node: any) {
    node.expanded = !node.expanded;
  }
}
