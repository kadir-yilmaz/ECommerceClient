import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base.component';
import { Category } from 'src/app/contracts/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderCategoriesDialogComponent } from './order-categories-dialog/order-categories-dialog.component';

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
  formShowOnHomepage: boolean = false;
  formHomepageOrder: number = 0;

  constructor(
    spinner: NgxSpinnerService,
    private categoryService: CategoryService,
    private toastr: CustomToastrService,
    private dialog: MatDialog
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
    this.formShowOnHomepage = false;
    this.formHomepageOrder = 0;
  }

  openEditForm(category: Category) {
    this.showForm = true;
    this.isEditing = true;
    this.formCategoryId = category.id;
    this.formCategoryName = category.name;
    this.formParentCategoryId = category.parentCategoryId || '';
    this.formShowOnHomepage = !!category.showOnHomepage;
    this.formHomepageOrder = category.homepageOrder || 0;
  }

  cancelForm() {
    this.showForm = false;
    this.formCategoryId = '';
    this.formCategoryName = '';
    this.formParentCategoryId = '';
    this.formShowOnHomepage = false;
    this.formHomepageOrder = 0;
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
          parentCategoryId: this.formParentCategoryId || undefined,
          showOnHomepage: this.formShowOnHomepage,
          homepageOrder: this.formHomepageOrder
        });
        this.toastr.message('Kategori güncellendi.', 'Başarılı', {
          messageType: ToastrMessageType.Success,
          position: ToastrPosition.BottomRight
        });
      } else {
        await this.categoryService.create({
          name: this.formCategoryName.trim(),
          parentCategoryId: this.formParentCategoryId || undefined,
          showOnHomepage: this.formShowOnHomepage,
          homepageOrder: this.formHomepageOrder
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

  async toggleShowcase(categoryId: string, showOnHomepage: boolean) {
    this.showSpinner(SpinnerType.BallAtom);
    try {
      await this.categoryService.changeShowcaseStatus(categoryId, showOnHomepage);
      this.toastr.message(showOnHomepage ? "Kategori vitrine eklendi." : "Kategori vitrinden kaldırıldı.", 'Başarılı', {
        messageType: ToastrMessageType.Success,
        position: ToastrPosition.BottomRight
      });
      await this.loadCategories();
    } catch {
      this.toastr.message("Vitrin durumu güncellenemedi.", 'Hata', {
        messageType: ToastrMessageType.Error,
        position: ToastrPosition.BottomRight
      });
      await this.loadCategories();
    } finally {
      this.hideSpinner(SpinnerType.BallAtom);
    }
  }

  openOrderDialog() {
    const dialogRef = this.dialog.open(OrderCategoriesDialogComponent, {
      width: '500px',
      data: this.categories.filter(c => c.showOnHomepage).sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0))
    });

    dialogRef.afterClosed().subscribe(async (result: { id: string, order: number }[]) => {
      if (result && result.length > 0) {
        this.showSpinner(SpinnerType.BallAtom);
        try {
          await this.categoryService.updateShowcaseOrder(result);
          this.toastr.message("Kategori sırası güncellendi.", 'Başarılı', {
            messageType: ToastrMessageType.Success,
            position: ToastrPosition.BottomRight
          });
          await this.loadCategories();
        } catch {
          this.toastr.message("Sıralama güncellenemedi.", 'Hata', {
            messageType: ToastrMessageType.Error,
            position: ToastrPosition.BottomRight
          });
        } finally {
          this.hideSpinner(SpinnerType.BallAtom);
        }
      }
    });
  }
}
