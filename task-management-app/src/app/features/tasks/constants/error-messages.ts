export const ERROR_MESSAGES = {
  TASK_VALIDATION: {
    INVALID_TITLE: 'タイトルが無効です',
    INVALID_DESCRIPTION: '説明が無効です',
    INVALID_CATEGORY: 'カテゴリが無効です',
    INVALID_PRIORITY: '優先度が無効です',
    INVALID_DUE_DATE: '期限が無効です',
    INVALID_STATUS: 'ステータスが無効です'
  },
  TASK_ANALYSIS: {
    CATEGORY_ANALYSIS_FAILED: 'カテゴリの分析に失敗しました',
    PRIORITY_ANALYSIS_FAILED: '優先度の分析に失敗しました',
    RELATED_TASKS_SEARCH_FAILED: '関連タスクの検索に失敗しました',
    ACTION_PLAN_GENERATION_FAILED: 'アクションプランの生成に失敗しました',
    MATRIX_ANALYSIS_FAILED: 'マトリックス分析に失敗しました',
    HISTORY_ANALYSIS_FAILED: '履歴分析に失敗しました'
  },
  FIRESTORE: {
    QUERY_FAILED: 'データベースのクエリに失敗しました',
    CONNECTION_ERROR: 'データベース接続エラーが発生しました',
    PERMISSION_DENIED: 'アクセス権限がありません',
    DOCUMENT_NOT_FOUND: '指定されたドキュメントが見つかりません'
  },
  SYSTEM: {
    UNEXPECTED_ERROR: '予期せぬエラーが発生しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    TIMEOUT_ERROR: 'タイムアウトが発生しました'
  }
}; 