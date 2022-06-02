import { Component, OnInit } from '@angular/core';
import { Recipe } from '../recipe.model';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.css']
})
export class RecipeListComponent implements OnInit {
  recipes : Recipe[] = [
    new Recipe('A Test Recipe', 'This is a test', 'https://c1.wallpaperflare.com/preview/992/474/505/food-meat-recipe-power.jpg'),
    new Recipe('A Test Recipe', 'This is a test', 'https://c1.wallpaperflare.com/preview/992/474/505/food-meat-recipe-power.jpg')
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
