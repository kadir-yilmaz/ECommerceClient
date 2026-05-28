import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './admin/components/dashboard/dashboard.component';
import { LayoutComponent } from './admin/layout/layout.component';
import { AuthGuard } from './guards/common/auth.guard';

const routes: Routes = [
  {
    path: "admin", 
    component: LayoutComponent, 
    canActivate: [AuthGuard],
    children: [
      { 
        path: "", 
        component: DashboardComponent, 
        canActivate: [AuthGuard] 
      },
      { 
        path: "customers", 
        loadChildren: () => import("./admin/components/customer/customer.module").then(module => module.CustomerModule), 
        canActivate: [AuthGuard] 
      },
      { 
        path: "products", 
        loadChildren: () => import("./admin/components/products/products.module").then(module => module.ProductsModule), 
        canActivate: [AuthGuard] 
      },
      { 
        path: "orders", 
        loadChildren: () => import("./admin/components/order/order.module").then(module => module.OrderModule), 
        canActivate: [AuthGuard] 
      },
      { 
        path: "roles", 
        loadChildren: () => import("./admin/components/role/role.module").then(module => module.RoleModule), 
        canActivate: [AuthGuard] 
      },
      { 
        path: "users", 
        loadChildren: () => import("./admin/components/user/user.module").then(module => module.UserModule), 
        canActivate: [AuthGuard] 
      },
      { 
        path: "access-denied", 
        loadChildren: () => import("./admin/components/access-denied/access-denied.module").then(module => module.AccessDeniedModule) 
      },
      { 
        path: "campaigns", 
        loadChildren: () => import("./admin/components/campaigns/campaigns.module").then(module => module.CampaignsModule), 
        canActivate: [AuthGuard] 
      }
    ]
  },
  { 
    path: "favorites", 
    loadChildren: () => import("./ui/components/favorites/favorites.module").then(module => module.FavoritesModule),
    canActivate: [AuthGuard]
  },
  { 
    path: "basket", 
    loadChildren: () => import("./ui/components/baskets/baskets.module").then(module => module.BasketsModule) 
  },
  { 
    path: "orders", 
    loadChildren: () => import("./ui/components/my-orders/my-orders.module").then(module => module.MyOrdersModule), 
    canActivate: [AuthGuard] 
  },
  { 
    path: "checkout", 
    loadChildren: () => import("./ui/components/checkout/checkout.module").then(module => module.CheckoutModule), 
    canActivate: [AuthGuard] 
  },
  { 
    path: "products", 
    loadChildren: () => import("./ui/components/products/products.module").then(module => module.ProductsModule) 
  },
  { 
    path: "products/:pageNo", 
    loadChildren: () => import("./ui/components/products/products.module").then(module => module.ProductsModule) 
  },
  { 
    path: "register", 
    loadChildren: () => import("./ui/components/register/register.module").then(module => module.RegisterModule) 
  },
  { 
    path: "login", 
    loadChildren: () => import("./ui/components/login/login.module").then(module => module.LoginModule) 
  },
  { 
    path: "password-reset", 
    loadChildren: () => import("./ui/components/password-reset/password-reset.module").then(module => module.PasswordResetModule) 
  },
  { 
    path: "update-password/:userId/:resetToken", 
    loadChildren: () => import("./ui/components/update-password/update-password.module").then(module => module.UpdatePasswordModule) 
  },
  { 
    path: "profile", 
    loadChildren: () => import("./ui/components/profile/profile.module").then(module => module.ProfileModule),
    canActivate: [AuthGuard]
  },
  { 
    path: "", 
    pathMatch: "full", 
    loadChildren: () => import("./ui/components/home/home.module").then(module => module.HomeModule) 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
