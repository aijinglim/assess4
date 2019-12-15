import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  showAlert = false;
  constructor(private router: Router, private recipeSvc: RecipeService) { }

  ngOnInit() {
  }

  login(form: NgForm){
    const username = form.value['username']
    const password = form.value['password'];
    this.recipeSvc.authenticateLogin(username, password)
    .then(result=>{
      if (result){
        this.router.navigate(['/']);
      }
      this.showAlert = true;
    });
  }

}
