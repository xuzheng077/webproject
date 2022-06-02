import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { IndexComponent } from './index/index.component';
import { AuthGuard } from './auth-guard';
import { DetailComponent } from './detail/detail.component';
import { HistoryComponent } from './history/history.component';
import { HistoryDetailComponent } from './historydetail/historydetail.component';

const routes: Routes = [
  { path: 'register', component: RegisterComponent},
  { path: 'welcome', component: WelcomeComponent},
  //{ path: 'login', component: LoginComponent},
  { path: '', component: LoginComponent},
  //{ path: 'index', component: IndexComponent, canActivate:[AuthGuard]},
  { path: 'index', component: IndexComponent},
  //{ path: 'detail/:cid/:uid/:regis_no', component: DetailComponent,canActivate:[AuthGuard]},
  { path: 'detail/:cid/:uid/:regis_no', component: DetailComponent},
  { path: 'history', component: HistoryComponent},
  { path: 'historydetail/:cid/:uid/:regis_no', component: HistoryDetailComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})

export class AppRoutingModule{

}
