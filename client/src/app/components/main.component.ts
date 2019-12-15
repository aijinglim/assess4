import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeService } from '../services/recipe.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(private router: Router, private recipeSvc: RecipeService) { }

  ngOnInit() {
  }

  navigateToCreate(){
    this.router.navigate(['/create']);
  }

  navigateToEdit(){
    this.router.navigate(['/reviewlist']);
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
