describe('認証機能', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('ログイン画面が表示される', () => {
    cy.get('[data-cy=login-form]').should('be.visible');
    cy.get('[data-cy=email-input]').should('be.visible');
    cy.get('[data-cy=password-input]').should('be.visible');
    cy.get('[data-cy=login-button]').should('be.visible');
  });

  it('無効な認証情報でログインできない', () => {
    cy.get('[data-cy=email-input]').type('invalid@example.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    cy.get('[data-cy=error-message]').should('be.visible');
  });

  it('有効な認証情報でログインできる', () => {
    cy.login('test@example.com', 'password123');
    cy.url().should('include', '/tasks');
    cy.get('[data-cy=user-menu]').should('be.visible');
  });

  it('ログアウトできる', () => {
    cy.login('test@example.com', 'password123');
    cy.get('[data-cy=user-menu]').click();
    cy.get('[data-cy=logout-button]').click();
    cy.url().should('include', '/login');
  });
}); 