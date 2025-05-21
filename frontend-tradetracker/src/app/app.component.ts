import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'TradeTracker';
  darkMode = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Réinitialiser la position de défilement à chaque changement de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Vérifier s'il y a un paramètre de requête 'scroll'
      const urlTree = this.router.parseUrl(this.router.url);
      const scrollParam = urlTree.queryParams['scroll'];

      // Ne pas réinitialiser le défilement si le paramètre scroll est présent
      if (scrollParam !== 'true') {
        window.scrollTo(0, 0);
      }
    });

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
