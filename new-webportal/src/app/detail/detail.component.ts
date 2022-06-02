import {Component,OnInit,OnDestroy,ChangeDetectionStrategy,ViewEncapsulation} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { environment} from '../../environments/environment.prod'

const BACKEND_URL = environment.backend_url;

@Component({
  selector: 'app-detail',
  templateUrl: './detail.new.component.html',
  // styleUrls: ['./detail.component.css'],
  // encapsulation: ViewEncapsulation.None,
})

export class DetailComponent implements OnInit, OnDestroy {
  customer_id = null;
  user_id = null;
  current_registration_no = null;
  //not changing
  user_name = "";
  email_address = "";
  user_image = "";
  license_no = "";
  license_expiry_date = "";
  current_license_status = "Not Uploaded";
  days_remaining = 0;
  current_vehicle_image_list = [];

  //changing
  current_make_name = "";
  current_model_name = "";
  current_service_status="Not Uploaded";
  current_last_service_date = "";
  current_service_file_url = "";
  current_registration_status = "Not Uploaded";
  current_registration_expiry_date = "";
  current_registration_rec_id = 0;
  current_cover_type = "";
  current_end_date = "";
  current_insurance_file_url = "";
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
          this.license_no = response.license_no;
          if(response.license_no != null && response.license_no != ""){
            this.current_license_status = "Licenced";
          }
          this.license_expiry_date = response.expiry_date;
          this.days_remaining = response.days_remaining;
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

    this.http.post<{message: string; last_service_date: string; file_url: string;}>(BACKEND_URL + '/sharevehicle/webdetailservice',post_body).subscribe((response) => {
      if (response.message === 'success') {
        this.current_last_service_date = response.last_service_date;
        //console.log(this.current_last_service_date);
        if(response.last_service_date != null && response.last_service_date != ""){
          this.current_service_status = "Serviced";
        }else{
          this.current_service_status = "Not Uploaded";
        }
        this.current_service_file_url = response.file_url;
      }
    });

    this.http.post<{message: string; expiry_date: string; registration_rec_id: number;}>(BACKEND_URL + '/sharevehicle/webdetailregistration',post_body).subscribe((response) => {
      if (response.message === 'success') {
        this.current_registration_expiry_date = response.expiry_date;
        if(response.expiry_date != null && response.expiry_date != ""){
          this.current_registration_status = "Completed";
        }else{
          this.current_registration_status = "Not Uploaded";
        }
        this.current_registration_rec_id = response.registration_rec_id;
      }
    });

    this.http.post<{message: string; cover_type: string; end_date: string; file_url:string}>(BACKEND_URL + '/sharevehicle/webdetailinsurance',post_body).subscribe((response) => {
      if (response.message === 'success') {
        this.current_cover_type = response.cover_type;
        this.current_end_date = response.end_date;
        this.current_insurance_file_url = response.file_url;
      }
    });

    const post_body_2 = {cust_id: this.customer_id, registration_no:registration_no};
    this.http.post<{message: string; result:[]}>(BACKEND_URL + '/sharevehicle/webdetailclaim',post_body_2).subscribe((response) => {
      if (response.message === 'success') {
        this.current_claim_list = response.result;
      }
    });
  }

  goToHistory(){
    this.router.navigate(['history']);
  }

  goToIndex(){
    this.router.navigate(['index']);
  }

  setReminder(){
    const post_body = {registration_rec_id: this.current_registration_rec_id};
    this.http.post<{message: string;}>(BACKEND_URL + '/sharevehicle/webdetailsetreminder',post_body).subscribe((response) => {
      if (response.message == 'success') {
        //propmt success
        alert("Set Reminder Successfully!");
      }else{
        alert("Set Reminder Failure!");
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

  ngOnDestroy() {}
}
