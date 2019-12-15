import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-reviewform',
  templateUrl: './reviewform.component.html',
  styleUrls: ['./reviewform.component.css']
})
export class ReviewformComponent implements OnInit {
  recipename;
  rating;
  comments;
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private recipeSvc: RecipeService) { }
  
  ngOnInit() {
    const reviewid = this.activatedRoute.snapshot.params.reviewid;
    this.recipeSvc.getReviewDetails(reviewid)
    .then(result=>{
      this.recipename = result.recipename;
      this.rating = result.rating;
      this.comments = result.comments; 
    })
  }

  submit(reviewForm: NgForm){
    this.recipeSvc.editReview(reviewForm.value, this.activatedRoute.snapshot.params.reviewid)
    .then(result=>{
      alert("Review successfully edited!");
      this.router.navigate(['/reviewlist']);
    })
  }

}
