import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    FormsModule,
    NgOptimizedImage
  ]
})
export class ChatModule { }
