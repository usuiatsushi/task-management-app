describe('Task Form', () => {
  beforeEach(() => {
    cy.visit('/tasks/new');
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', () => {
      cy.get('button[type="submit"]').click();

      cy.contains('タイトルは必須です').should('be.visible');
      cy.contains('説明は必須です').should('be.visible');
      cy.contains('カテゴリは必須です').should('be.visible');
      cy.contains('担当者は必須です').should('be.visible');
    });

    it('should validate title field', () => {
      cy.get('input[formControlName="title"]').as('titleInput');

      // 最小文字数チェック
      cy.get('@titleInput').type('ab').blur();
      cy.contains('タイトルは3文字以上で入力してください').should('be.visible');

      // 最大文字数チェック
      cy.get('@titleInput').clear().type('a'.repeat(51)).blur();
      cy.contains('タイトルは50文字以下で入力してください').should('be.visible');

      // 特殊文字チェック
      cy.get('@titleInput').clear().type('test<>test').blur();
      cy.contains('特殊文字（<>）は使用できません').should('be.visible');

      // 正常な入力
      cy.get('@titleInput').clear().type('正常なタイトル').blur();
      cy.contains('タイトルは必須です').should('not.exist');
    });

    it('should validate description field', () => {
      cy.get('textarea[formControlName="description"]').as('descInput');

      // 最大文字数チェック
      cy.get('@descInput').type('a'.repeat(1001)).blur();
      cy.contains('説明は1000文字以下で入力してください').should('be.visible');

      // 特殊文字チェック
      cy.get('@descInput').clear().type('test<>test').blur();
      cy.contains('特殊文字（<>）は使用できません').should('be.visible');

      // 正常な入力
      cy.get('@descInput').clear().type('正常な説明文').blur();
      cy.contains('説明は必須です').should('not.exist');
    });

    it('should validate due date field', () => {
      cy.get('input[formControlName="dueDate"]').as('dateInput');

      // 過去の日付
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      cy.get('@dateInput').type(pastDate.toISOString().split('T')[0]).blur();
      cy.contains('過去の日付は選択できません').should('be.visible');

      // 1年以上先の日付
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      cy.get('@dateInput').clear().type(futureDate.toISOString().split('T')[0]).blur();
      cy.contains('1年以上先の日付は選択できません').should('be.visible');

      // 正常な日付
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 1);
      cy.get('@dateInput').clear().type(validDate.toISOString().split('T')[0]).blur();
      cy.contains('期限は必須です').should('not.exist');
    });
  });

  describe('Category Management', () => {
    it('should add new category', () => {
      const newCategory = '新しいカテゴリ' + Date.now();
      
      cy.get('input[formControlName="newCategoryName"]').type(newCategory);
      cy.contains('button', '+ 追加').click();

      cy.get('mat-select[formControlName="category"]').click();
      cy.get('mat-option').contains(newCategory).should('be.visible');
    });

    it('should not add empty category', () => {
      cy.contains('button', '+ 追加').should('be.disabled');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', () => {
      // 有効なデータを入力
      cy.get('input[formControlName="title"]').type('テストタスク');
      cy.get('textarea[formControlName="description"]').type('テストの説明');
      cy.get('mat-select[formControlName="category"]').click();
      cy.get('mat-option').first().click();
      cy.get('input[formControlName="assignedTo"]').type('テストユーザー');

      // フォーム送信
      cy.get('button[type="submit"]').click();

      // 成功メッセージの確認
      cy.contains('タスクを作成しました').should('be.visible');
    });
  });
}); 