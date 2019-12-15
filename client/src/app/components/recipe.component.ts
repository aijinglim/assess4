import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css']
})
export class RecipeComponent implements OnInit {
  recipe = {
    recipeName: "",
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    description: "",
    serving: 0,
    category: [],
    ingredients: [],
    instructions: [],
    username: "",
    submitted: "",
    image_url: "",
    reviews: [],
    averageRating: 0
  };

  originalServing;
  originalAmts = [];
  showReviewForm = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private recipeSvc: RecipeService) { }

  ngOnInit() {
    const recipeid = this.activatedRoute.snapshot.params.recipeid;
    this.recipeSvc.getRecipeDetails(recipeid)
    .then(result=>{
      this.originalServing = result.serving;
      for (let g=0; g<result.ingredients.length; g++){
        this.originalAmts.push(result.ingredients[g].amount);
      }
      this.recipe = result;

      // convert average rating to 2 decimal place
      if (result.averageRating){
        this.recipe.averageRating = result.averageRating.toFixed(2);
      }
      
      for (let g=0; g<this.originalAmts.length; g++){
        if (!isNaN(Number(this.recipe.ingredients[g].amount)) && Number(this.recipe.ingredients[g].amount)<=0){
          this.recipe.ingredients[g].amount = '';
        }
      }
      
      if (!result.image_url.startsWith("http")){
        this.recipe.image_url = `https://day24-fileupload.sgp1.digitaloceanspaces.com/foodFinder/${result.image_url}`;
      }
    })
  }

  addReview(){
    if (!this.recipeSvc.isAuthenticatedLogin()){
      alert("You need to be logged in! \n Navigating to login page...")
      this.router.navigate(['/login']);
    }
    this.showReviewForm = true;
  }

  submit(reviewForm: NgForm){
    this.recipeSvc.addReview(reviewForm.value, this.activatedRoute.snapshot.params.recipeid)
    .then(result=>{
      alert("Review successfully added!");
      this.router.routeReuseStrategy.shouldReuseRoute = function(){
        return false;
      };
      this.router.events.subscribe((evt) => {
        if (evt instanceof NavigationEnd) {
            this.router.navigated = false;
            window.scrollTo(0, 0);
        }
      });
      this.router.navigate(['/recipe', this.activatedRoute.snapshot.params.recipeid]);
    })
  }

  adjustServing($event){
    const newServing = $event.target.value;
    //adjust all the amounts according to the serving 

    let adjustBy = parseInt(this.originalServing, 10)/parseInt(newServing, 10);

    for (let g=0; g<this.originalAmts.length; g++){
      // if the amount IS a number
      if (!isNaN(Number(this.originalAmts[g]))){
        // adjust and convert to 1 decimal place
        const adjustedValue = Number(this.originalAmts[g])/adjustBy;
        this.recipe.ingredients[g].amount = Math.round( adjustedValue * 10) / 10;
        if ((this.recipe.ingredients[g].amount)<=0){
          this.recipe.ingredients[g].amount = '';
        }
      }
    }
  }
}
