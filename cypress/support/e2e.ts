// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTask(title: string, description: string): Chainable<void>;
      createProject(name: string, description: string): Chainable<void>;
    }
  }
}

// カスタムコマンドの定義
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();
});

Cypress.Commands.add('createTask', (title: string, description: string) => {
  cy.get('[data-cy=new-task-button]').click();
  cy.get('[data-cy=task-title-input]').type(title);
  cy.get('[data-cy=task-description-input]').type(description);
  cy.get('[data-cy=save-task-button]').click();
});

Cypress.Commands.add('createProject', (name: string, description: string) => {
  cy.get('[data-cy=new-project-button]').click();
  cy.get('[data-cy=project-name-input]').type(name);
  cy.get('[data-cy=project-description-input]').type(description);
  cy.get('[data-cy=save-project-button]').click();
});