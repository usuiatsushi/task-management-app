describe('プロジェクト管理機能', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  it('プロジェクト一覧が表示される', () => {
    cy.visit('/projects');
    cy.get('[data-cy=project-list]').should('be.visible');
    cy.get('[data-cy=project-item]').should('have.length.at.least', 1);
  });

  it('新規プロジェクトを作成できる', () => {
    const projectName = `テストプロジェクト ${Date.now()}`;
    const projectDescription = 'テストプロジェクトの説明';

    cy.createProject(projectName, projectDescription);
    cy.get('[data-cy=project-list]').should('contain', projectName);
  });

  it('プロジェクトの詳細を表示できる', () => {
    cy.get('[data-cy=project-item]').first().click();
    cy.get('[data-cy=project-detail]').should('be.visible');
    cy.get('[data-cy=project-name]').should('be.visible');
    cy.get('[data-cy=project-description]').should('be.visible');
  });

  it('プロジェクトのタスク一覧を表示できる', () => {
    cy.get('[data-cy=project-item]').first().click();
    cy.get('[data-cy=project-tasks]').should('be.visible');
    cy.get('[data-cy=task-item]').should('have.length.at.least', 0);
  });

  it('プロジェクトを編集できる', () => {
    const newName = `更新済みプロジェクト ${Date.now()}`;
    cy.get('[data-cy=project-item]').first().click();
    cy.get('[data-cy=edit-project-button]').click();
    cy.get('[data-cy=project-name-input]').clear().type(newName);
    cy.get('[data-cy=save-project-button]').click();
    cy.get('[data-cy=project-name]').should('contain', newName);
  });

  it('プロジェクトを削除できる', () => {
    const projectName = `削除用プロジェクト ${Date.now()}`;
    cy.createProject(projectName, '削除テスト用プロジェクト');
    
    cy.get('[data-cy=project-item]').contains(projectName).click();
    cy.get('[data-cy=delete-project-button]').click();
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-button]').click();
    
    cy.get('[data-cy=project-list]').should('not.contain', projectName);
  });

  it('プロジェクトを検索できる', () => {
    const searchTerm = 'テスト';
    cy.get('[data-cy=search-input]').type(searchTerm);
    cy.get('[data-cy=project-item]').each(($el) => {
      expect($el.text().toLowerCase()).to.include(searchTerm.toLowerCase());
    });
  });

  it('プロジェクトをフィルタリングできる', () => {
    cy.get('[data-cy=filter-button]').click();
    cy.get('[data-cy=status-filter]').select('進行中');
    cy.get('[data-cy=apply-filter-button]').click();
    cy.get('[data-cy=project-item]').should('have.length.at.least', 1);
  });
}); 