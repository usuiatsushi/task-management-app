describe('パフォーマンステスト', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  it('タスク一覧の初期ロード時間', () => {
    cy.visit('/tasks', {
      onBeforeLoad: (win) => {
        win.performance.mark('start-load');
      },
    });

    cy.get('[data-cy=task-list]').should('be.visible').then(() => {
      cy.window().then((win) => {
        win.performance.mark('end-load');
        win.performance.measure('load-time', 'start-load', 'end-load');
        const measure = win.performance.getEntriesByName('load-time')[0];
        expect(measure.duration).to.be.lessThan(2000); // 2秒以内にロード
      });
    });
  });

  it('大量のタスク表示時のパフォーマンス', () => {
    // 100件のタスクを作成
    for (let i = 0; i < 100; i++) {
      cy.createTask(`パフォーマンステストタスク ${i}`, `テスト説明 ${i}`);
    }

    cy.window().then((win) => {
      const memory = (win.performance as any).memory;
      if (memory) {
        expect(memory.usedJSHeapSize).to.be.lessThan(100 * 1024 * 1024); // 100MB以下
      }
    });

    // スクロール時のパフォーマンス
    cy.get('[data-cy=task-list]').scrollTo('bottom', { duration: 1000 });
    cy.get('[data-cy=task-item]').should('have.length.at.least', 100);
  });

  it('プロジェクト一覧の初期ロード時間', () => {
    cy.visit('/projects', {
      onBeforeLoad: (win) => {
        win.performance.mark('start-load');
      },
    });

    cy.get('[data-cy=project-list]').should('be.visible').then(() => {
      cy.window().then((win) => {
        win.performance.mark('end-load');
        win.performance.measure('load-time', 'start-load', 'end-load');
        const measure = win.performance.getEntriesByName('load-time')[0];
        expect(measure.duration).to.be.lessThan(2000); // 2秒以内にロード
      });
    });
  });

  it('タスク検索のレスポンス時間', () => {
    cy.visit('/tasks');
    cy.window().then((win) => {
      win.performance.mark('search-start');
    });

    cy.get('[data-cy=search-input]').type('テスト');

    cy.get('[data-cy=task-item]').should('be.visible').then(() => {
      cy.window().then((win) => {
        win.performance.mark('search-end');
        win.performance.measure('search-time', 'search-start', 'search-end');
        const measure = win.performance.getEntriesByName('search-time')[0];
        expect(measure.duration).to.be.lessThan(500); // 500ms以内に検索結果表示
      });
    });
  });

  it('タスクステータス更新のレスポンス時間', () => {
    cy.visit('/tasks');
    cy.get('[data-cy=task-item]').first().click();

    cy.window().then((win) => {
      win.performance.mark('update-start');
    });

    cy.get('[data-cy=status-select]').select('進行中');

    cy.get('[data-cy=progress-bar]').should('have.attr', 'aria-valuenow', '50').then(() => {
      cy.window().then((win) => {
        win.performance.mark('update-end');
        win.performance.measure('update-time', 'update-start', 'update-end');
        const measure = win.performance.getEntriesByName('update-time')[0];
        expect(measure.duration).to.be.lessThan(1000); // 1秒以内に更新
      });
    });
  });

  it('ネットワークリクエストの最適化', () => {
    cy.intercept('GET', '**/tasks*').as('getTasks');
    cy.visit('/tasks');

    cy.wait('@getTasks').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
      expect(interception.response?.headers['content-type']).to.include('application/json');
      expect(interception.response?.body).to.be.an('array');
    });
  });

  it('メモリリークの検出', () => {
    cy.visit('/tasks');
    
    // 初期メモリ使用量を記録
    cy.window().then((win) => {
      const initialMemory = (win.performance as any).memory?.usedJSHeapSize;
      
      // 複数回の操作を実行
      for (let i = 0; i < 10; i++) {
        cy.get('[data-cy=task-item]').first().click();
        cy.get('[data-cy=status-select]').select('進行中');
        cy.get('[data-cy=back-button]').click();
      }

      // 最終メモリ使用量を確認
      cy.window().then((win) => {
        const finalMemory = (win.performance as any).memory?.usedJSHeapSize;
        if (initialMemory && finalMemory) {
          const memoryIncrease = finalMemory - initialMemory;
          expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024); // 10MB以下の増加
        }
      });
    });
  });
}); 