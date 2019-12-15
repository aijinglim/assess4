import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray, NgForm } from '@angular/forms';
import { RecipeService } from '../services/recipe.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {Recipe} from '../models'
import { __core_private_testing_placeholder__ } from '@angular/core/testing';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  @ViewChild('uploadForm', {static: false}) uploadForm: NgForm;
  @ViewChild('imageFile', {static: false}) imageFile: ElementRef;
  
  clickedSubmit = false;
  f;
  addRecipeForm: FormGroup;
  ingredientsArr: FormArray;
  categoryArr: FormArray;
  instructArr: FormArray;
  recipeid: number;

  constructor(private fb: FormBuilder, private activatedRoute: ActivatedRoute, private router:Router, private http: HttpClient, private recipeSvc: RecipeService) { }
  ngOnInit() {
    this.addRecipeForm= this.createForm();
    this.ingredientsArr = this.addRecipeForm.get('ingredientsArr') as FormArray;
    this.categoryArr = this.addRecipeForm.get('categoryArr') as FormArray;
    this.instructArr = this.addRecipeForm.get('instructArr') as FormArray;
  }
  //control is anything that receives input. button is not a control
  private createForm(): FormGroup {
    this.f = this.fb.group({
      recipeName: this.fb.control('', Validators.required),
      prepTime: this.fb.control('0'),
      cookTime: this.fb.control('0'),
      description: this.fb.control(''),
      serving: this.fb.control('', [Validators.required, Validators.pattern("^[0-9]*$")]),
      categoryArr: this.fb.array([]),
      ingredientsArr: this.fb.array([], [Validators.required]),
      instructArr: this.fb.array([], [Validators.required])
    })
    return (this.f);
  }

  submit(uploadFormData){
    const recipe: Recipe = {
      recipeName: this.addRecipeForm.value['recipeName'],
      prepTime: this.addRecipeForm.value['prepTime'],
      cookTime: this.addRecipeForm.value['cookTime'],
      description: this.addRecipeForm.value['description'],
      serving : this.addRecipeForm.value['serving'],
      category: [],
      ingredients: [],
      instructions: [],
      username: '',
      submitted: new Date(),
      image_url: ''
    }
    let categoryArr = this.addRecipeForm.value['categoryArr'];
    for (let g=0; g<categoryArr.length; g++){
      recipe.category.push(categoryArr[g].category);
    }

    let ingredientsArr = this.addRecipeForm.value['ingredientsArr'];
    for (let g=0; g<ingredientsArr.length; g++){
      recipe.ingredients.push(ingredientsArr[g]);
    }

    let instructArr = this.addRecipeForm.value['instructArr'];
    for (let g=0; g<instructArr.length; g++){
      recipe.instructions.push(instructArr[g].instructions);
    }


    this.recipeSvc.addRecipe(uploadFormData, recipe)
    .then(result=>{
      this.recipeid = result.recipeid;
      uploadFormData.set('recipeid', this.recipeid);
      return this.recipeSvc.uploadImg(uploadFormData)
      .then(result=>{
        if (confirm('Recipe has been submitted successfully! View recipe details?')) {
          
          this.router.navigate(['/recipe', this.recipeid]);
        }
      })
      .catch(err=>{
        console.log("Error in uploadImg:", err);
      })
    })
    .catch(err=>{
      console.log("Error addRecipe:", err);
    })
  }

  // ingredient
  private createIngredientDetails(): FormGroup{
    const f = this.fb.group({
      amount: this.fb.control('', [Validators.required, Validators.pattern("^[^/]+$")]),
      unit: this.fb.control(''),
      name: this.fb.control('', [Validators.required])
    })
    return (f);
  }

  addIngredient(){
    this.ingredientsArr.push(this.createIngredientDetails());
  }

  deleteIngredient(idx: number){
    this.ingredientsArr.removeAt(idx);
  }

  // category 
  private createCategoryArr(): FormGroup{
    const f = this.fb.group({
      category: this.fb.control('', [Validators.required])
    })
    return (f);
  }

  addCategory(){
    this.categoryArr.push(this.createCategoryArr());
  }

  deleteCategory(idx: number){
    this.categoryArr.removeAt(idx);
  }

  // instructions
  private createInstructArr(): FormGroup{
    const f = this.fb.group({
      instructions: this.fb.control('', [Validators.required])
    })
    return (f);
  }

  addInstruction(){
    this.instructArr.push(this.createInstructArr());
  }

  deleteInstruction(idx: number){
    this.instructArr.removeAt(idx);
  }

  // upload image
  upload(uploadForm: NgForm){
    this.clickedSubmit = true;

    if (uploadForm.status == "VALID" && this.addRecipeForm.valid){
      const uploadFormData= new FormData();
      uploadFormData.set('myImage', this.imageFile.nativeElement.files[0]);
      
      // when clicking the submit button for upload form (template driven), also submit the recipe form (reactive form)
      this.submit(uploadFormData);
    }
  }
}
