import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { DigitalSigntureComponent } from './digital-signture/digital-signture.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DigitalSigntureComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [DigitalSigntureComponent]
})
export class AppModule { }
