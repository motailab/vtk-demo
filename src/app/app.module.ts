import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { VtkTestComponent } from './vtk-test/vtk-test.component';
import { DepthComponent } from './depth/depth.component';
import { ArrowsourceComponent } from './arrowsource/arrowsource.component';

@NgModule({
  declarations: [
    AppComponent,
    VtkTestComponent,
    DepthComponent,
    ArrowsourceComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
