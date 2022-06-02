import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegisterComponent } from './customer_auth/register/register.component';
import { LoginComponent } from './customer_auth/login/login.component';
import { WelcomeComponent } from './customer_auth/welcome/welcome.component';
import { IndexComponent } from './index/index.component';
import { AuthGuard } from './customer_auth/auth-guard';
import { Detailcomponent } from './detail/detail.component';

const routes: Routes = [
  { path: 'register', component: RegisterComponent},
  { path: 'welcome', component: WelcomeComponent},
  //{ path: 'welcome', component: WelcomeComponent, canActivate:[AuthGuard]},
  { path: 'login', component: LoginComponent},
  //{ path: 'index', component: IndexComponent, canActivate:[AuthGuard]},
  { path: 'detail/:cid/:uid/:regis_no', component: Detailcomponent},
  { path: 'index', component: IndexComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule{

}
