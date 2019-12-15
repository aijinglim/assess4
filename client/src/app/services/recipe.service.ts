import { Injectable } from '@angular/core';

import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  public authenticatedLogin: boolean;
  private token: string;
  constructor(private http: HttpClient, private router: Router) { }

  // AUTHENTICATION

  isAuthenticatedLogin():boolean{
    return this.authenticatedLogin;
  }

  authenticateLogin(username:string, password: string): Promise<boolean>{
    const params = new HttpParams()
    .set('username', username)
    .set('password', password);

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded');
    return (
      this.http.post('/api/login', params.toString(), {headers})
      .toPromise()
      .then((result: any) => {
        this.authenticatedLogin = true;
        this.token = result.access_token;
        return true;
        }
      )
      .catch((err)=>{
        console.error(err);
        this.authenticatedLogin = false;
        return false;
        }
      )
    )
  }

  // ROUTE GUARD
  canActivate(route:ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authenticatedLogin){
      alert("You need to be logged in! \n Navigating to login page...")
      this.router.navigate(['/login']);
    }
    return (this.authenticatedLogin);
  }

  // RECIPE RELATED

  getRecipeDetails(recipeid){
    return (
      this.http.get<any>(`/api/recipe/${recipeid}`).toPromise()
    );
  }

  // returns the recipeid
  addRecipe(uploadFormData, recipe): Promise<any>{
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
    return (
      this.http.post('/api/recipe', JSON.stringify(recipe), {headers}).toPromise()
    );
  }

  uploadImg(formData){
    return this.http.post('/api/recipeimg', formData).toPromise()
  }

  getRecipeIdRange(){
    return(
      this.http.get<any>('/api/recipe/random').toPromise()
    );
  }

  searchRecipe(queryparams){
    const params = new HttpParams()
    .set('searchterm', queryparams.searchterm)
    .set('filter', queryparams.filter);
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded');
    return(
      this.http.post<any>('/api/recipes', params.toString(), {headers}).toPromise()
    );
  }

  // REVIEWS RELATED

  addReview(reviewForm, recipeid){
    const reviewData= new HttpParams()
    .set('recipeid', recipeid)
    .set('rating', reviewForm.rating)
    .set('comments', reviewForm.comments);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${this.token}`
    });
    return (
      this.http.post('/api/review', reviewData.toString(), {headers}).toPromise()
    )
  }

  getUserReviews(){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    return(
      this.http.get<any>('/api/user/review', {headers}).toPromise()
    );
  }

  editReview(reviewForm, reviewid){
    const reviewData= new HttpParams()
    .set('reviewid', reviewid)
    .set('rating', reviewForm.rating)
    .set('comments', reviewForm.comments);
    return(
      this.http.put<any>(`/api/user/review/${reviewid}`, {reviewData}).toPromise()
    );
  }

  deleteReview(reviewid){
    return(
      this.http.delete<any>(`/api/user/review/${reviewid}`).toPromise()
    );
  }

  getReviewDetails(reviewid){
    return(
      this.http.get<any>(`/api/user/review/${reviewid}`).toPromise()
    );
  }

  // oauth
  authenticateGoogle(){
    console.log("this happens");
    return(
      this.http.get<any>('/auth/google')
    );
  }

}
