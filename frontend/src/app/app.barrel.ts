/**
 * Application Barrel File
 * Central export point for all app modules and components
 *
 * Usage:
 * import { Services, Models, AdminComponents } from '@app/app.barrel';
 */

// Export all major modules
export * from './services';
export * from './models';
export * from './directives';
export * from './core';
export * from './layout';
export * from './components';

// Export root component
export * from './app.component';
