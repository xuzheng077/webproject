import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment} from '../../environments/environment.prod';
import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';

const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.new.html',
  //styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  isLoading = false;
  result : boolean;
  form : FormGroup;
  private customerId: number;
  private token: string;

  constructor(private http: HttpClient,public authService:AuthService, private router:Router){}

  ngOnInit(){
    this.form = new FormGroup({
      'email': new FormControl(null, {validators: [Validators.required]}),
      'password': new FormControl(null, {validators: [Validators.required]})
    })
  }


  onLogin(){

    // if(this.form.invalid){
    //   return;
    // }
    //console.log(this.form.value.email);
    //console.log(this.form.value.password);

    //this.isLoading = true;
    //this.router.navigate(['/index']);

    const password_sha256 = Base64.stringify(sha256(this.form.value.password));
    const customer = { email: this.form.value.email, password: password_sha256 };
    //console.log(customer.email + " " + customer.password);
    this.http.post<{ message: string; token: string; expiresIn: number; cust_id: number}>(BACKEND_URL + '/customers/login', customer)
      .subscribe((response) => {
        const customer_id = response.cust_id;
        const token = response.token;

        this.customerId = customer_id;

        this.authService.setcustomerId(customer_id);
        this.authService.setEmailAndPassword(this.form.value.email, password_sha256);

        this.token = token;

        if (token) {
          //console.log("here");
          this.router.navigate(['/index']);
        }else{
          alert("Please enter correct email and password!");
        }
      });
    //this.isLoading = false;
  }

  goBackToRegister(){
    this.router.navigate(['register']);
  }
}
