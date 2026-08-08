import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'invoices/new',
        loadComponent: () =>
          import('./features/invoice/invoice-form/invoice-form').then((m) => m.InvoiceForm),
      },
      {
        path: 'invoices/:id/edit',
        loadComponent: () =>
          import('./features/invoice/invoice-form/invoice-form').then((m) => m.InvoiceForm),
      },
      {
        path: 'invoices/:id/report',
        loadComponent: () =>
          import('./features/invoice/invoice-report/invoice-report').then((m) => m.InvoiceReport),
      },
      {
        path: 'settings/banks',
        loadComponent: () =>
          import('./features/settings/bank-settings/bank-settings').then((m) => m.BankSettings),
      },
      {
        path: 'settings/recipients',
        loadComponent: () =>
          import('./features/settings/recipient-settings/recipient-settings').then(
            (m) => m.RecipientSettings
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
