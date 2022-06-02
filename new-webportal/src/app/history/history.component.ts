import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';


import { environment} from '../../environments/environment.prod'
import { FormControl, FormGroup, Validators } from '@angular/forms';

const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-history',
  templateUrl: './history.component.new.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit, OnDestroy{
  //customerIsAuthenticated = false;
  //image = null;
  image = "";

  customerName = null;
  customerId = null;
  full_results = [];
  results = [];
  form : FormGroup;


  constructor(private authService:AuthService,private router:Router, private http: HttpClient, public DomSanitizationService: DomSanitizer ){}

  ngOnInit(){
    this.form = new FormGroup({
      'sharefrom': new FormControl(null, {validators: [Validators.required]}),
      'shareto': new FormControl(null, {validators: [Validators.required]}),
      'user': new FormControl(null, {validators: [Validators.required]})
    })

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
              this.results = response.result;
              for(let i=0;i<this.results.length;i++){
                if(this.results[i].recurring_end_date == ""){
                  this.results[i].recurring_end_date = this.results[i].date
                }
                let recurring_days_str = "";
                for(let j=0;j<this.results[i].recurring_days.length;j++){
                  if(this.results[i].recurring_days[j] == '0'){
                    recurring_days_str = recurring_days_str + "Sun, ";
                  }else if(this.results[i].recurring_days[j] == '1'){
                    recurring_days_str = recurring_days_str + "Mon, ";
                  }else if(this.results[i].recurring_days[j] == '2'){
                    recurring_days_str = recurring_days_str + "Tue, ";
                  }else if(this.results[i].recurring_days[j] == '3'){
                    recurring_days_str = recurring_days_str + "Wed, ";
                  }else if(this.results[i].recurring_days[j] == '4'){
                    recurring_days_str = recurring_days_str + "Thu, ";
                  }else if(this.results[i].recurring_days[j] == '5'){
                    recurring_days_str = recurring_days_str + "Fri, ";
                  }else if(this.results[i].recurring_days[j] == '6'){
                    recurring_days_str = recurring_days_str + "Sat, ";
                  }
                }
                recurring_days_str = recurring_days_str.substr(0,recurring_days_str.length-2);
                this.results[i].recurring_days = recurring_days_str;
                this.full_results = this.results;
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
    this.router.navigate(['historydetail', this.customerId, entry.user_id, entry.registration_no]);
  }

  goToIndex(){
    this.router.navigate(['index']);
  }

  onSearch(){
    let share_from = this.form.value.sharefrom;
    if(share_from == ""){
      share_from = null;
    }
    let share_to = this.form.value.shareto;
    if(share_to == ""){
      share_to = null;
    }
    let user = this.form.value.user;
    if(user == ""){
      user = null;
    }
    let new_list = [];
    if(this.full_results.length == 0){
      alert("There is no data available.");
    }else{
      if(share_from == null && share_to==null && user==null){
        this.results = this.full_results;
        alert("Please specify search conditions.");
      }else{
        if(share_from == null && share_to==null && user != null){
          for(let i=0;i<this.full_results.length;i++){
            if(this.full_results[i].user_name == user){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from == null && share_to !=null && user == null){
          for(let i=0;i<this.full_results.length;i++){
            if(this.full_results[i].date <= share_to || this.full_results[i].recurring_end_date <= share_to){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from != null && share_to ==null && user == null){
          for(let i=0;i<this.full_results.length;i++){
            if(this.full_results[i].date >= share_from || this.full_results[i].recurring_end_date >= share_from){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from == null && share_to !=null && user != null){
          for(let i=0;i<this.full_results.length;i++){
            if((this.full_results[i].date <= share_to || this.full_results[i].recurring_end_date <= share_to) && this.full_results[i].user_name == user){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from != null && share_to ==null && user != null){
          for(let i=0;i<this.full_results.length;i++){
            if((this.full_results[i].date >= share_from || this.full_results[i].recurring_end_date >= share_from) && this.full_results[i].user_name == user){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from != null && share_to !=null && user == null){
          for(let i=0;i<this.full_results.length;i++){
            if((this.full_results[i].date >= share_from || this.full_results[i].recurring_end_date >= share_from) && (this.full_results[i].date <= share_to || this.full_results[i].recurring_end_date <= share_to)){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }else if(share_from != null && share_to !=null && user != null){
          for(let i=0;i<this.full_results.length;i++){
            if((this.full_results[i].date >= share_from || this.full_results[i].recurring_end_date >= share_from) && (this.full_results[i].date <= share_to || this.full_results[i].recurring_end_date <= share_to)&& this.full_results[i].user_name == user){
              new_list.push(this.full_results[i]);
            }
          }
          this.results = new_list;
        }
      }
    }
  }

}
