import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { RecipeService } from './services/recipe.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'client';
  showLoginButton = true;
  constructor(public router: Router, private recipeSvc: RecipeService) {
    this.showLoginButton = !this.recipeSvc.isAuthenticatedLogin();
  }

  navigateToLogin(){
    this.router.navigate(['/login']);
  }

  search(form: NgForm){
    const searchterm = form.value.searchbar;
    const filter = form.value.filterBy;

    // refresh the page
    this.router.routeReuseStrategy.shouldReuseRoute = function(){
      return false;
    };
    this.router.navigate(['/recipelist'], { queryParams: { searchterm: searchterm, filter: filter }});
  }

  navigateToRandomRecipe(){
    this.recipeSvc.getRecipeIdRange()
    .then(result=>{
      const allRecipeIds = [];
      for (let g=0; g<result.length; g++){
        allRecipeIds.push(result[g].recipeid);
      }
      //get a random index 
      const randomIndex = Math.floor(Math.random() * allRecipeIds.length) + 0;
      const randomRecipeId = allRecipeIds[randomIndex];
      
      this.router.navigate(['/recipe', randomRecipeId]);
    })
  }
}
