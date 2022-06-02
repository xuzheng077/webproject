import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { mimeType } from './mime-type.validator';
import { AuthService } from '../auth.service';
//import { Country, State } from './country.state.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment} from '../../environments/environment.prod';
import Base64 from 'crypto-js/enc-base64';
import sha256 from 'crypto-js/sha256';


const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-register',
  templateUrl:'./register.new.component.html'
  //styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  isLoading = false;
  form: FormGroup;
  logoPreview: string;
  // public selectedCountry: Country = new Country(1, 'USA');
  // public countries: Country[];
  // public states: State[];
  // public allStates: State[];

  constructor(private http: HttpClient, public authService: AuthService, private router:Router) {}

  ngOnInit() {

    // this.http.get<{message: string; response: { Country_id: number; Country_name: string }[];}>(BACKEND_URL + '/countries')
    //   .subscribe((response) => {
    //     this.countries = new Array(response.response.length);
    //     for (var i = 0; i < response.response.length; i++) {
    //       this.countries[i] = new Country(response.response[i].Country_id,response.response[i].Country_name);
    //     }
    //   });

    // this.http.get<{message: string;response: {State_id: number;State_Name: string;Country_id: number;}[];}>(BACKEND_URL + '/states')
    //   .subscribe((response) => {
    //     this.allStates = new Array(response.response.length);
    //     for (var i = 0; i < response.response.length; i++) {
    //       this.allStates[i] = new State(response.response[i].State_id, response.response[i].Country_id, response.response[i].State_Name);
    //     }
    //   });

    this.form = new FormGroup({
      companyName: new FormControl(null, { validators: [Validators.required] }),
      companyAddr1: new FormControl(null, {validators: [Validators.required],}),
      companyAddr2: new FormControl(null, {validators: [Validators.required],}),
      state: new FormControl(null, { validators: [Validators.required] }),
      country: new FormControl(null, { validators: [Validators.required] }),
      postCode: new FormControl(null, { validators: [Validators.required] }),
      webAddr: new FormControl(null, { validators: [Validators.required] }),
      email: new FormControl(null, {validators: [Validators.required, Validators.email],}),
      password: new FormControl(null, { validators: [Validators.required] }),
      confirmPassword:new FormControl(null, { validators: [Validators.required] }),
      image: new FormControl(null, {asyncValidators: [mimeType]}),
    });
  }

  onRegister() {
    // if (this.form.invalid) {
    //   return;
    // }

    // this.isLoading = true;

    //send http request

    if(this.form.value.password != this.form.value.confirmPassword){
      alert("Two passwords do not match!");
    }else{
      const password_sha256 = Base64.stringify(sha256(this.form.value.password));
      //console.log(password_sha256);
      const postData = new FormData();
      postData.append('companyName', this.form.value.companyName);
      postData.append('companyAddr1', this.form.value.companyAddr1);
      postData.append('companyAddr2', this.form.value.companyAddr2);
      postData.append('postCode', this.form.value.postCode);
      postData.append('webAddr', this.form.value.webAddr);
      postData.append('country', this.form.value.country);
      postData.append('state', this.form.value.state);
      postData.append('email', this.form.value.email);
      postData.append('password', password_sha256);
      postData.append('logo', this.form.value.image);

      this.http.post<{message:string; email:string; customer_id:number}>(BACKEND_URL + '/customers/register', postData)
        .subscribe((response) => {
          this.authService.setcustomerId(response.customer_id);

          this.router.navigate(['/']);
        });
      //this.isLoading = false;
      //this.form.reset();
    }
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({ image: file });
    this.form.get('image').updateValueAndValidity();

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  goToLogin(){
    this.router.navigate(['/']);
  }

  // onSelect() {
  //   this.states = this.allStates.filter(
  //     (item) => item.countryid == this.form.value.country
  //   );
  // }

}
