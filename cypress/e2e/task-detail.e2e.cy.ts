/// <reference types="cypress" />

describe('タスク詳細画面 E2E', () => {
  // テスト用のタスクID（実際のデータベースに合わせて変更してください）
  const testTaskId = '1';

  it('タスク詳細画面が表示される', () => {
    cy.visit(`/tasks/${testTaskId}`);
    cy.contains('テストタスク').should('exist');
    cy.contains('テストタスクの説明').should('exist');
  });

  it('進捗バーが表示され、値を変更できる', () => {
    cy.visit(`/tasks/${testTaskId}`);
    cy.get('mat-slider').should('exist');
    // スライダーの値を50に変更（mat-sliderのテストは工夫が必要）
    cy.get('mat-slider').invoke('val', 50).trigger('change');
    // 進捗値が50%になっていることを確認（UI上の表示やAPIのレスポンスで確認）
  });

  it('サブタスクを追加できる', () => {
    cy.visit(`/tasks/${testTaskId}`);
    cy.get('input[placeholder="サブタスクタイトル"]').type('E2Eサブタスク');
    cy.get('input[placeholder="担当者"]').type('E2Eユーザー');
    cy.contains('追加').click();
    cy.contains('E2Eサブタスク').should('exist');
  });

  it('タスクを削除できる', () => {
    cy.visit(`/tasks/${testTaskId}`);
    cy.contains('削除').click();
    cy.contains('タスクの削除').should('exist');
    cy.contains('削除').click();
    cy.url().should('include', '/tasks');
  });
}); 