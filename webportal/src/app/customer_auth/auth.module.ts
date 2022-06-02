import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AngularMaterialModule } from '../angular-material.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';

@NgModule({
  declarations:[
    RegisterComponent,
    LoginComponent
  ],
  imports:[
    AppRoutingModule,
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class AuthModule{

}
