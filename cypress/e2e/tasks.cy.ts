describe('タスク管理機能', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  it('タスク一覧が表示される', () => {
    cy.visit('/tasks');
    cy.get('[data-cy=task-list]').should('be.visible');
    cy.get('[data-cy=task-item]').should('have.length.at.least', 1);
  });

  it('新規タスクを作成できる', () => {
    const taskTitle = `テストタスク ${Date.now()}`;
    const taskDescription = 'テストタスクの説明';

    cy.createTask(taskTitle, taskDescription);
    cy.get('[data-cy=task-list]').should('contain', taskTitle);
  });

  it('タスクの詳細を表示できる', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=task-detail]').should('be.visible');
    cy.get('[data-cy=task-title]').should('be.visible');
    cy.get('[data-cy=task-description]').should('be.visible');
  });

  it('タスクのステータスを更新できる', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=status-select]').select('進行中');
    cy.get('[data-cy=progress-bar]').should('have.attr', 'aria-valuenow', '50');
  });

  it('タスクの進捗を更新できる', () => {
    cy.get('[data-cy=task-item]').first().click();
    cy.get('[data-cy=progress-slider]').invoke('val', 75).trigger('change');
    cy.get('[data-cy=progress-bar]').should('have.attr', 'aria-valuenow', '75');
  });

  it('タスクを削除できる', () => {
    const taskTitle = `削除用タスク ${Date.now()}`;
    cy.createTask(taskTitle, '削除テスト用タスク');
    
    cy.get('[data-cy=task-item]').contains(taskTitle).click();
    cy.get('[data-cy=delete-task-button]').click();
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-button]').click();
    
    cy.get('[data-cy=task-list]').should('not.contain', taskTitle);
  });

  it('タスクを検索できる', () => {
    const searchTerm = 'テスト';
    cy.get('[data-cy=search-input]').type(searchTerm);
    cy.get('[data-cy=task-item]').each(($el) => {
      expect($el.text().toLowerCase()).to.include(searchTerm.toLowerCase());
    });
  });

  it('タスクをフィルタリングできる', () => {
    cy.get('[data-cy=filter-button]').click();
    cy.get('[data-cy=status-filter]').select('進行中');
    cy.get('[data-cy=apply-filter-button]').click();
    cy.get('[data-cy=task-item]').should('have.length.at.least', 1);
  });
}); 