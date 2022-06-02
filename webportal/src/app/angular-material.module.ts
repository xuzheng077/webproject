import { NgModule } from '@angular/core';
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule} from '@angular/material/select';
import { MatDialogModule } from "@angular/material/dialog";

@NgModule({
  imports:[
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule
  ],
  exports:[
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule]
})
export class AngularMaterialModule{

}
