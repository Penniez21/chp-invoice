import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // สร้าง ThemeService ตั้งแต่ระดับ root เพื่อให้ธีมถูกใช้ทุกหน้า (รวมหน้า login)
  private readonly theme = inject(ThemeService);
}
