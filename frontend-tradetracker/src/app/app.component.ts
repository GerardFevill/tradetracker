import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'TradeTracker';
  darkMode = false;

  ngOnInit(): void {
    // Check if dark mode preference exists in local storage
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      this.darkMode = storedDarkMode === 'true';
    } else {
      // Check if user prefers dark mode at the OS level
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode = prefersDarkMode;
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
  }
}
