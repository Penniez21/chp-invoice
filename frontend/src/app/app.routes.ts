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
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoice/invoice-list/invoice-list').then((m) => m.InvoiceList),
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
        path: 'receipts',
        loadComponent: () =>
          import('./features/receipt/receipt-list/receipt-list').then((m) => m.ReceiptList),
      },
      {
        path: 'receipts/new',
        loadComponent: () =>
          import('./features/receipt/receipt-form/receipt-form').then((m) => m.ReceiptForm),
      },
      {
        path: 'receipts/:id/edit',
        loadComponent: () =>
          import('./features/receipt/receipt-form/receipt-form').then((m) => m.ReceiptForm),
      },
      {
        path: 'receipts/:id/report',
        loadComponent: () =>
          import('./features/receipt/receipt-report/receipt-report').then((m) => m.ReceiptReport),
      },
      {
        path: 'quotations',
        loadComponent: () =>
          import('./features/quotation/quotation-list/quotation-list').then((m) => m.QuotationList),
      },
      {
        path: 'quotations/new',
        loadComponent: () =>
          import('./features/quotation/quotation-form/quotation-form').then((m) => m.QuotationForm),
      },
      {
        path: 'quotations/:id/edit',
        loadComponent: () =>
          import('./features/quotation/quotation-form/quotation-form').then((m) => m.QuotationForm),
      },
      {
        path: 'quotations/:id/report',
        loadComponent: () =>
          import('./features/quotation/quotation-report/quotation-report').then((m) => m.QuotationReport),
      },
      {
        path: 'settings/quoters',
        loadComponent: () =>
          import('./features/settings/quoter-settings/quoter-settings').then((m) => m.QuoterSettings),
      },
      {
        path: 'settings/customers',
        loadComponent: () =>
          import('./features/settings/customer-settings/customer-settings').then((m) => m.CustomerSettings),
      },
      {
        path: 'settings/banks',
        loadComponent: () =>
          import('./features/settings/bank-settings/bank-settings').then((m) => m.BankSettings),
      },
      {
        path: 'settings/issuers',
        loadComponent: () =>
          import('./features/settings/issuer-settings/issuer-settings').then(
            (m) => m.IssuerSettings
          ),
      },
      {
        path: 'settings/recipients',
        loadComponent: () =>
          import('./features/settings/recipient-settings/recipient-settings').then(
            (m) => m.RecipientSettings
          ),
      },
      {
        path: 'settings/account',
        loadComponent: () =>
          import('./features/settings/account-settings/account-settings').then(
            (m) => m.AccountSettings
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
