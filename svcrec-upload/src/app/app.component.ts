import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  form: FormGroup;
  preview: string;


  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.form = new FormGroup({
     file: new FormControl(null, {validators: [Validators.required]}),
    });
  }

  onUpload() {
    if (this.form.invalid) {
      //console.log('form invalid');
      return;
    }


    //upload


    //this.form.reset();
  }

  onFilePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({ file: file });
    this.form.get('file').updateValueAndValidity();
    //console.log(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.preview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

}
