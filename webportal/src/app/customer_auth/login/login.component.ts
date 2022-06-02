import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent{
  isLoading = false;
  form : FormGroup;

  constructor(public authService:AuthService, private router:Router){}

  ngOnInit(){
    this.form = new FormGroup({
      'email': new FormControl(null, {validators: [Validators.required]}),
      'password': new FormControl(null, {validators: [Validators.required]})
    })
  }

  
  onLogin(){

    if(this.form.invalid){
      return;
    }

    this.isLoading = true;

    this.authService.loginCustomer(this.form.value.email, this.form.value.password);

    this.isLoading = false;
  }

  goBackToRegister(){
    this.router.navigate(['/register']);
  }
}
