import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

//const BACKEND_URL = 'http://localhost:3000/api/v1';
const BACKEND_URL = 'http://54.206.19.123:3000/api/v1';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css'],
  encapsulation: ViewEncapsulation.None,
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class Detailcomponent implements OnInit, OnDestroy {
  customer_id = null;
  user_id = null;

  user_name = null;
  user_image = null;
  email_address = null;
  vehicle_list = [];

  current_registration_no = null;
  current_driver_license = null;
  current_service_date = null;
  current_next_service_date = null;
  current_service_record_url = null;
  current_registration_due = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public DomSanitizationService: DomSanitizer
  ) {}

  ngOnInit() {
    this.customer_id = this.route.snapshot.params['cid'];
    this.user_id = this.route.snapshot.params['uid'];
    this.current_registration_no = this.route.snapshot.params['regis_no'];

    //console.log(this.customer_id+" "+this.user_id);
    this.http.get<{message: string; user_id: string; user_name: string; user_image: string; email_address: string; vehicle_list: [];}>(BACKEND_URL + '/sharevehicle/sharedetailweb/' + this.customer_id + '/' + this.user_id).subscribe((response) => {
        if (response.message === 'success') {
          this.vehicle_list = response.vehicle_list;
          //console.log(this.vehicle_list);
          this.user_name = response.user_name;
          this.user_image = 'data:image/png;base64,' + response.user_image;
          this.email_address = response.email_address;

          for (let i = 0; i < this.vehicle_list.length; i++) {
            if (
              this.current_registration_no === this.vehicle_list[i].registration_no
            ) {
              this.current_service_date = 'Last Service - ' + this.vehicle_list[i].service_date;
              this.current_next_service_date = 'Next Service - ' + this.vehicle_list[i].next_service_date;
              this.current_service_record_url = this.vehicle_list[i].record_temp_pathS3;
              this.current_registration_due = 'Registration Due - 2020-08-14';
              this.current_driver_license = 'Driver License, Class C, Expires 2021-05-14';
            }
          }
        }
      });
  }

  OnImageClick(vehicle) {
    this.current_registration_no = vehicle.registration_no;
    this.current_service_date = 'Last Service - ' + vehicle.service_date;
    this.current_next_service_date = 'Next Service - ' + vehicle.next_service_date;
    this.current_service_record_url = vehicle.record_temp_pathS3;
    this.current_registration_due = 'Registration Due - 2020-08-14';
    this.current_driver_license = 'Driver License, Class C, Expires 2021-05-14';
  }

  ngOnDestroy() {}
}
