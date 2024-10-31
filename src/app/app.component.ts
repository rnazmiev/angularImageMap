import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImageEditorComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'interactive-map-editor';
}
