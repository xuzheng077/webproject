import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

const BACKEND_URL = 'http://54.206.19.123:3000/api/v1';

//const BACKEND_URL = 'http://localhost:3000/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnInit {
  private token: string;
  private isAuthenticated: boolean;
  private authStatusListener = new Subject<boolean>();
  private tokenTimer: any;
  private customerId: number;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {

  }

  getToken() {
    return this.token;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getCustomerId(){
    return this.customerId;
  }

  private saveAuthData(token: string, expirationInDate: Date) {
    localStorage.setItem('token', token);
    localStorage.setItem('expirationDate', expirationInDate.toISOString());
  }

  private clearAuthDate() {
    localStorage.removeItem('token');
    localStorage.removeItem('expirationDate');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expirationDate');
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
    };
  }

  autoAuthCustomer() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListener.next(true);
    }
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  registerCustomer(
    companyName: string,
    companyAddr1: string,
    companyAddr2: string,
    webAddr: string,
    postCode: string,
    country: string,
    state: string,
    email: string,
    password: string,
    image: File
  ) {
    //console.log(image);

    const postData = new FormData();
    postData.append('companyName', companyName);
    postData.append('companyAddr1', companyAddr1);
    postData.append('companyAddr2', companyAddr2);
    postData.append('postCode', postCode);
    postData.append('webAddr', webAddr);
    postData.append('country', country);
    postData.append('state', state);
    postData.append('email', email);
    postData.append('password', password);
    postData.append('logo', image);

    this.http
      .post<{message:string; email:string; customer_id:number}>(BACKEND_URL + '/customers/register', postData)
      .subscribe((response) => {
        this.customerId = response.customer_id;
        this.router.navigate(['/welcome']);
      });
  }

  loginCustomer(email: string, password: string) {
    //console.log(email + " "+ password);

    const customer = { email: email, password: password };

    this.http
      .post<{ message: string; token: string; expiresIn: number; cust_id: number}>(
        BACKEND_URL + '/customers/login',
        customer
      )
      .subscribe((response) => {
        const customer_id = response.cust_id;
        const token = response.token;

        this.customerId = customer_id;
        this.token = token;
        if (token) {
          const expiresInDuration = response.expiresIn;
          //console.log(expiresInDuration);
          this.setAuthTimer(expiresInDuration);
          this.isAuthenticated = true;
          this.authStatusListener.next(true);
          const now = new Date();
          const expirationDate = new Date(
            now.getTime() + expiresInDuration * 1000
          );
          this.saveAuthData(token, expirationDate);
          this.router.navigate(['/index']);
        }
      });
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthDate();
    this.router.navigate(['/login']);
  }
}
