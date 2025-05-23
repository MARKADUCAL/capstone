import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    // Use provideAnimations() for browser and provideNoopAnimations() for server
    typeof window !== 'undefined'
      ? provideAnimations()
      : provideNoopAnimations(),
    importProvidersFrom(HttpClientModule),
  ],
};
