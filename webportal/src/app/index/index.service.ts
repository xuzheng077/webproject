import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const BACKEND_URL = 'http://54.206.19.123:3000/api/v1';
//const BACKEND_URL = 'http://localhost:3000/api/v1';

@Injectable({ providedIn: 'root' })
export class IndexService implements OnInit {
  private image;

  constructor(private http: HttpClient){}

  ngOnInit(){

  }

  // getCustomerInfo(customerId:number){
  //   console.log(customerId);

  // }
}
