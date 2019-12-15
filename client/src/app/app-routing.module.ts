import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './components/main.component';
import { LoginComponent } from './components/login.component';
import { CreateComponent } from './components/create.component';
import { RecipeComponent } from './components/recipe.component';
import { RecipeService } from './services/recipe.service';
import { ReviewlistComponent } from './components/reviewlist.component';
import { ReviewformComponent } from './components/reviewform.component';
import { RecipelistComponent } from './components/recipelist.component';

const routes: Routes = [
  { path: "", component: MainComponent },
  { path: "main/:username", component: MainComponent },
  { path: "login", component: LoginComponent },
  { path: "create", component: CreateComponent, canActivate: [RecipeService] },
  { path: "recipelist", component: RecipelistComponent },
  { path: "reviewlist", component: ReviewlistComponent, canActivate: [RecipeService]},
  { path: "review/:reviewid", component: ReviewformComponent, canActivate: [RecipeService] },
  { path: "recipe/:recipeid", component: RecipeComponent },
  { path: "**", redirectTo: "/", pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
