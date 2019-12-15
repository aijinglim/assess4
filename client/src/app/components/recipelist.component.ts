import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../services/recipe.service';

@Component({
  selector: 'app-recipelist',
  templateUrl: './recipelist.component.html',
  styleUrls: ['./recipelist.component.css']
})
export class RecipelistComponent implements OnInit {
  recipes;
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private recipeSvc: RecipeService) { }

  ngOnInit() {
    this.recipeSvc.searchRecipe(this.activatedRoute.snapshot.queryParams)
    .then(result=>{
      this.recipes = result;

      for (let g=0; g<this.recipes.length; g++){
        if (!this.recipes[g].image_url.startsWith("http")){
          this.recipes[g].image_url = `https://day24-fileupload.sgp1.digitaloceanspaces.com/foodFinder/${this.recipes[g].image_url}`;
        }
      }
    })
  }

  viewRecipe(recipeid){
    this.router.navigate(['/recipe', recipeid]);
  }

}
