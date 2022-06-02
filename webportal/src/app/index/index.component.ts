import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { AuthService } from '../customer_auth/auth.service';
import { IndexService } from './index.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

//const BACKEND_URL = 'http://localhost:3000/api/v1';
const BACKEND_URL = 'http://54.206.19.123:3000/api/v1';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy{
  customerIsAuthenticated = false;
  image = null;
  customerName = null;
  customerId = null;
  results = [];

  headElements = ['Owner', 'Registration', 'Date_From - Date_To, Days', 'Time'];

  private authListenerSubs: Subscription;

  constructor(private authService:AuthService,private router:Router, private indexService:IndexService, private http: HttpClient, public DomSanitizationService: DomSanitizer ){}

  ngOnInit(){
    //this.customerId = this.authService.getCustomerId();
    this.customerId = 14;
    this.customerIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubs = this.authService.getAuthStatusListener().subscribe(isAuthenticated => {
      this.customerIsAuthenticated = isAuthenticated;
    });

    this.http.get<{message: string, company_name:string, logo:string}>(BACKEND_URL+'/customers/'+this.customerId)
    .subscribe((response)=>{
      if(response.message==='success'){
        this.customerName=response.company_name;
        this.image = "data:image/png;base64,"+ response.logo;
      }
    });

    this.http.get<{message:string, result:[]}>(BACKEND_URL+'/sharevehicle/sharedvehiclelist/'+this.customerId)
    .subscribe((response)=>{
      if(response.message === 'success'){
        this.results = response.result;
      }
    });
  }

  ngOnDestroy(){
    this.authListenerSubs.unsubscribe();
  }

  goToDetail(entry){
    //console.log(entry);
    this.router.navigate(['/detail', this.customerId,entry.user_id,entry.registration_no]);
    //this.router.navigate(['/detail']);
  }

  // getCustomerInfo(){
  //   this.indexService.getCustomerInfo(this.customerId);
  // }


}
