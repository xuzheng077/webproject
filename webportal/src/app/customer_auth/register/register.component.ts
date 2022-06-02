import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { mimeType } from './mime-type.validator';
import { AuthService } from '../auth.service';
import { Country, State } from './country.state.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

const BACKEND_URL = 'http://54.206.19.123:3000/api/v1';
//const BACKEND_URL = 'http://localhost:3000/api/v1';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  isLoading = false;
  form: FormGroup;
  logoPreview: string;
  public selectedCountry: Country = new Country(1, 'USA');
  public countries: Country[];
  public states: State[];
  public allStates: State[];

  constructor(private http: HttpClient, public authService: AuthService, private router:Router) {}

  ngOnInit() {
    // this.countries = this.authService.getCountries();
    // this.states = this.authService.getStates();

    this.http
      .get<{
        message: string;
        response: { Country_id: number; Country_name: string }[];
      }>(BACKEND_URL + '/countries')
      .subscribe((response) => {
        this.countries = new Array(response.response.length);
        for (var i = 0; i < response.response.length; i++) {
          this.countries[i] = new Country(
            response.response[i].Country_id,
            response.response[i].Country_name
          );
        }
      });

    this.http
      .get<{
        message: string;
        response: {
          State_id: number;
          State_Name: string;
          Country_id: number;
        }[];
      }>(BACKEND_URL + '/states')
      .subscribe((response) => {
        this.allStates = new Array(response.response.length);
        for (var i = 0; i < response.response.length; i++) {
          this.allStates[i] = new State(
            response.response[i].State_id,
            response.response[i].Country_id,
            response.response[i].State_Name
          );
        }
        //console.log(this.allStates);
      });

    this.form = new FormGroup({
      companyName: new FormControl(null, { validators: [Validators.required] }),
      companyAddr1: new FormControl(null, {
        validators: [Validators.required],
      }),
      companyAddr2: new FormControl(null, {
        validators: [Validators.required],
      }),
      state: new FormControl(null, { validators: [Validators.required] }),
      country: new FormControl(null, { validators: [Validators.required] }),
      postCode: new FormControl(null, { validators: [Validators.required] }),
      webAddr: new FormControl(null, { validators: [Validators.required] }),
      email: new FormControl(null, {
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl(null, { validators: [Validators.required] }),
      image: new FormControl(null, {
        asyncValidators: [mimeType],
      }),
    });
  }

  onRegister() {
    if (this.form.invalid) {
      //console.log('form invalid');
      return;
    }

    this.isLoading = true;

    //send http request

    this.authService.registerCustomer(
      this.form.value.companyName,
      this.form.value.companyAddr1,
      this.form.value.companyAddr2,
      this.form.value.webAddr,
      this.form.value.postCode,
      this.form.value.country.toString(),
      this.form.value.state.toString(),
      this.form.value.email,
      this.form.value.password,
      this.form.value.image
    );

    this.isLoading = false;
    //this.form.reset();
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({ image: file });
    this.form.get('image').updateValueAndValidity();
    //console.log(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSelect() {
    this.states = this.allStates.filter(
      (item) => item.countryid == this.form.value.country
    );
    //console.log(this.states);
  }

  goToLogin(){
    this.router.navigate(['/login']);
  }
}
