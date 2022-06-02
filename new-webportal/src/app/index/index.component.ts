import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';


import { environment} from '../../environments/environment.prod'

const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-index',
  templateUrl: './index.component.new.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy{
  //customerIsAuthenticated = false;
  //image = null;
  image = "";

  customerName = null;
  customerId = null;
  results = [];

  //private authListenerSubs: Subscription;

  constructor(private authService:AuthService,private router:Router, private http: HttpClient, public DomSanitizationService: DomSanitizer ){}

  ngOnInit(){

    const emailAndPass = this.authService.getEmailAndPassword();

    if(emailAndPass == null){
      this.router.navigate(['/']);
    }else{
      const customer = { email: emailAndPass.email, password: emailAndPass.password };

      this.http.post<{ message: string; token: string; expiresIn: number; cust_id: number}>(BACKEND_URL + '/customers/login', customer)
        .subscribe((response) => {
        const customer_id = response.cust_id;

        this.authService.setcustomerId(customer_id);
        this.customerId = this.authService.getCustomerId();
        //this.customerId = 14;
        // this.customerIsAuthenticated = this.authService.getIsAuth();
        // this.authListenerSubs = this.authService.getAuthStatusListener().subscribe(isAuthenticated => {
        //   this.customerIsAuthenticated = isAuthenticated;
        // });

        this.http.get<{message: string, company_name:string, logo:string}>(BACKEND_URL+'/customers/'+this.customerId)
          .subscribe((response)=>{
            if(response.message==='success'){
              this.customerName=response.company_name;
              this.image = "data:image/png;base64,"+ response.logo;
            }
        });

        this.http.get<{message:string, result:{date:string, end_time:string, recurring_days:string, recurring_end_date:string, recurring_flag:number, registration_no:string, share_id:number,start_time:string,user_id:number,user_name:string}[]}>(BACKEND_URL+'/sharevehicle/sharedvehiclelist/'+this.customerId)
          .subscribe((response)=>{
            if(response.message === 'success'){
              const today = this.getNowDate();

              for(let i=0;i<response.result.length;i++){
                if(response.result[i].date>=today || (response.result[i].recurring_end_date >= today)){
                  if(response.result[i].recurring_end_date == ""){
                    response.result[i].recurring_end_date = response.result[i].date
                  }
                  let recurring_days_str = "";
                  for(let j=0;j<response.result[i].recurring_days.length;j++){
                    if(response.result[i].recurring_days[j] == '0'){
                      recurring_days_str = recurring_days_str + "Sun, ";
                    }else if(response.result[i].recurring_days[j] == '1'){
                      recurring_days_str = recurring_days_str + "Mon, ";
                    }else if(response.result[i].recurring_days[j] == '2'){
                      recurring_days_str = recurring_days_str + "Tue, ";
                    }else if(response.result[i].recurring_days[j] == '3'){
                      recurring_days_str = recurring_days_str + "Wed, ";
                    }else if(response.result[i].recurring_days[j] == '4'){
                      recurring_days_str = recurring_days_str + "Thu, ";
                    }else if(response.result[i].recurring_days[j] == '5'){
                      recurring_days_str = recurring_days_str + "Fri, ";
                    }else if(response.result[i].recurring_days[j] == '6'){
                      recurring_days_str = recurring_days_str + "Sat, ";
                    }
                  }
                  recurring_days_str = recurring_days_str.substr(0, recurring_days_str.length - 2);
                  response.result[i].recurring_days = recurring_days_str;
                  this.results.push(response.result[i]);
                }
              }
            }
          });
      });
    }
  }

  ngOnDestroy(){
  }

  goToDetail(entry){
    //this.authService.setDetails(this.customerId, entry.user_id, entry.registration_no);
    this.router.navigate(['detail', this.customerId, entry.user_id, entry.registration_no]);
  }

  goToHistory(){
    this.router.navigate(['history']);
  }

  getNowDate(): string {
    const date = new Date();
    let month: string | number = date.getMonth() + 1;
    let strDate: string | number = date.getDate();

    if (month <= 9) {
      month = "0" + month;
    }

    if (strDate <= 9) {
      strDate = "0" + strDate;
    }

    return date.getFullYear() + "-" + month + "-" + strDate;
  }
}
