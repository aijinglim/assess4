import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd} from '@angular/router';
import { RecipeService } from '../services/recipe.service';

@Component({
  selector: 'app-reviewlist',
  templateUrl: './reviewlist.component.html',
  styleUrls: ['./reviewlist.component.css']
})
export class ReviewlistComponent implements OnInit {
  reviews = [];
  // navigationSubscription;
  constructor(private router: Router, private recipeSvc: RecipeService) { }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = function(){
        return false;
    };
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
          this.router.navigated = false;
          window.scrollTo(0, 0);
      }
    });
    this.recipeSvc.getUserReviews()
    .then(result=>{
      this.reviews = result;
    })
  }

  editReview(reviewid){
    this.router.navigate(['/review', reviewid]);
  }

  deleteReview(reviewid){
    if (confirm('Are you sure you want to delete this review?')) {
      this.recipeSvc.deleteReview(reviewid)
      .then(result=>{
        alert("Review successfully deleted!");
        this.router.navigate(['/reviewlist']);
      });
    }
  }

  viewRecipe(recipeid){
    this.router.navigate(['/recipe', recipeid]);
  }
}
