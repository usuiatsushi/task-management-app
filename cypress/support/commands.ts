export {};

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// パフォーマンス測定用の型定義
declare global {
  interface Window {
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }
}

// パフォーマンス測定用のカスタムコマンド
Cypress.Commands.add('measurePerformance', (name: string, callback: () => void) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });

  callback();

  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = win.performance.getEntriesByName(name)[0];
    return measure.duration;
  });
});

// メモリ使用量の測定
Cypress.Commands.add('measureMemoryUsage', () => {
  return cy.window().then((win) => {
    const memory = (win.performance as any).memory;
    const result = memory ? {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    } : null;
    return cy.wrap(result);
  });
});

// ネットワークリクエストの測定
Cypress.Commands.add('measureNetworkRequests', (urlPattern: string) => {
  const requests: any[] = [];
  
  cy.intercept(urlPattern, (req) => {
    const startTime = performance.now();
    req.on('response', (res) => {
      const endTime = performance.now();
      requests.push({
        url: req.url,
        method: req.method,
        duration: endTime - startTime,
        status: res.statusCode,
        size: res.headers['content-length']
      });
    });
  });

  return cy.wrap(requests);
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();
  cy.url().should('include', '/tasks');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      measurePerformance(name: string, callback: () => void): Chainable<number>;
      measureMemoryUsage(): Chainable<{ used: number; total: number; limit: number; } | null>;
      measureNetworkRequests(urlPattern: string): Chainable<any[]>;
    }
  }
}