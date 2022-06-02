import {Component,OnInit,OnDestroy,ChangeDetectionStrategy,ViewEncapsulation} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { environment} from '../../environments/environment.prod'

const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-detail',
  templateUrl: './historydetail.new.component.html',
  // styleUrls: ['./historydetail.component.css'],
  // encapsulation: ViewEncapsulation.None,
})

export class HistoryDetailComponent implements OnInit, OnDestroy {
  customer_id = null;
  user_id = null;
  current_registration_no = null;
  //not changing
  user_name = "";
  email_address = "";
  user_image = "";

  current_vehicle_image_list = [];

  //changing
  current_make_name = "";
  current_model_name = "";
  current_claim_list = []; //date, total_km, total_time, claim_amount, parking_rec_id, fuel_rec_id
  current_image = "";


  constructor(private router:Router,private route: ActivatedRoute,private http: HttpClient,public DomSanitizationService: DomSanitizer) {}

  ngOnInit() {
    this.customer_id = this.route.snapshot.params['cid'];
    this.user_id = this.route.snapshot.params['uid'];
    this.current_registration_no = this.route.snapshot.params['regis_no'];

    //get user info
    const current_date = this.getNowDate();
    const post_body_0 = {user_id: this.user_id, current_date:current_date}
    this.http.post<{message: string; user_name: string; email_address: string; image: string; license_no:string; expiry_date:string;days_remaining:number;}>(BACKEND_URL + '/sharevehicle/webdetailuser',post_body_0).subscribe((response) => {
        if (response.message === 'success') {
          this.user_name = response.user_name;
          this.email_address = response.email_address;
          this.user_image = 'data:image/png;base64,' + response.image;
        }
    });

    const post_body_1 = {user_id: this.user_id, cust_id:this.customer_id};
    this.http.post<{message: string; result: [];}>(BACKEND_URL + '/sharevehicle/webdetailregistrationimage',post_body_1).subscribe((response) => {
      if (response.message === 'success') {
        this.current_vehicle_image_list = response.result;
        this.current_image = 'data:image/png;base64,' + this.current_vehicle_image_list[0].image;
      }
    });

    this.change(this.current_registration_no);
  }

  OnImageClick(entry) {
    this.current_registration_no = entry.registration_no;
    for(let i=0;i<this.current_vehicle_image_list.length;i++){
      if(this.current_registration_no == this.current_vehicle_image_list[i].registration_no){
        this.current_image = 'data:image/png;base64,' + this.current_vehicle_image_list[i].image;
      }
    }

    this.change(entry.registration_no);
  }

  change(registration_no:string){
    const post_body = {registration_no: registration_no};
    this.http.post<{message: string; make_name: string; model_name: string;}>(BACKEND_URL + '/sharevehicle/webdetailvehicle',post_body).subscribe((response) => {
      if (response.message === 'success') {
        this.current_make_name = response.make_name;
        this.current_model_name = response.model_name;
      }
    });


    const post_body_2 = {cust_id: this.customer_id, registration_no:registration_no};
    this.http.post<{message: string; result:[]}>(BACKEND_URL + '/sharevehicle/webdetailclaim',post_body_2).subscribe((response) => {
      if (response.message === 'success') {
        this.current_claim_list = response.result;
      }
    });
  }

  getParkingReceipt(entry){
    const post_body = {parking_rec_id: entry.parking_rec_id};
    this.http.post<{message: string; file_url: string;}>(BACKEND_URL + '/sharevehicle/webdetailparkingreceipt',post_body).subscribe((response) => {
      if (response.message == 'success') {
        window.open(response.file_url,'_blank');
      }else{
        alert("Error!");
      }
    });
  }
  getFuelReceipt(entry){
    const post_body = {fuel_rec_id: entry.fuel_rec_id};
    this.http.post<{message: string; file_url: string;}>(BACKEND_URL + '/sharevehicle/webdetailfuelreceipt',post_body).subscribe((response) => {
      if (response.message == 'success') {
        window.open(response.file_url,'_blank');
      }else{
        alert("Error!");
      }
    });
  }

  getNowDate() {
    //return string
    var returnDate = "";
    //get datetime now
    var today = new Date();
    //split
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //because January is 0!
    var yyyy = today.getFullYear();
    //Interpolation date
    returnDate = yyyy+"-";
    if (mm < 10) {
      returnDate = returnDate + "0"+mm+"-";
    } else {
      returnDate = returnDate+ mm+"-";
    }
    if (dd < 10) {
        returnDate = returnDate+"0"+dd;
    } else {
        returnDate = returnDate+dd;
    }
    return returnDate;
  }

  goToHistory(){
    this.router.navigate(['history']);
  }

  goToIndex(){
    this.router.navigate(['index']);
  }

  ngOnDestroy() {}
}
