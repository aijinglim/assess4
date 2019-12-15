import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule }from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login.component';
import { MainComponent } from './components/main.component';
import { CreateComponent } from './components/create.component';
import { RecipeComponent } from './components/recipe.component';
import { ReviewlistComponent } from './components/reviewlist.component';
import { ReviewformComponent } from './components/reviewform.component';
import { RecipelistComponent } from './components/recipelist.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// 
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    CreateComponent,
    RecipeComponent,
    ReviewlistComponent,
    ReviewformComponent,
    RecipelistComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
