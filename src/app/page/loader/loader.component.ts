import { NgIf } from '@angular/common';
import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  imports: [NgIf],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css'
})
export class LoaderComponent {
   @Input() isLoading: boolean = false;

}
