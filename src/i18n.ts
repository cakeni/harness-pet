import type { PetStatus } from './status.js'

export const UI_LANGUAGES = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'] as const
export type UiLanguage = (typeof UI_LANGUAGES)[number]

export interface StatusCopy {
  label: string
  title: string
  subtitle: string
}

export interface UiCopy {
  languageName: string
  language: string
  enablePet: string
  petSize: string
  opacity: string
  reducedMotion: string
  debugState: string
  autoCycle: string
  currentStatus: string
  resetPosition: string
  showDialog: string
  openDesktopWindow: string
  desktopWindowUnsupported: string
  desktopWindowHint: string
  returnToHarness: string
  followHarness: string
  closeSettings: string
  settingsLabel: string
  disclaimer: string
  desktopWindowFailed: string
  desktopWindowUnsupportedMessage: string
  desktopWindowOpenFailed: string
  petLabel: string
  openSettings: string
  closeDialog: string
  expandFollowup: string
  collapseFollowup: string
  followupPlaceholder: string
  followupInputLabel: string
  sendFollowup: string
  enterFollowup: string
  currentSessionUnavailable: string
  sendFailed: string
  replying: string
  waitingForYou: string
  processing: string
  statuses: Record<PetStatus, StatusCopy>
}

const COPY: Record<UiLanguage, UiCopy> = {
  'en-US': {
    languageName: 'English',
    language: 'Language',
    enablePet: 'Enable Pet',
    petSize: 'Pet Size',
    opacity: 'Opacity',
    reducedMotion: 'Reduced Motion',
    debugState: 'Debug State',
    autoCycle: 'Auto-cycle',
    currentStatus: 'Current Status',
    resetPosition: 'Reset Position',
    showDialog: 'Show Dialog',
    openDesktopWindow: 'Open Floating Pet',
    desktopWindowUnsupported: 'Floating Pet Unsupported',
    desktopWindowHint: 'Keeps the pet visible when Harness is minimized. Keep the browser running.',
    returnToHarness: 'Return to Harness',
    followHarness: 'Follow Harness',
    closeSettings: 'Close settings',
    settingsLabel: 'Harness Pet settings',
    disclaimer: 'This is an unofficial community project. Not affiliated with, endorsed by, or maintained by DeepSeek.',
    desktopWindowFailed: 'Desktop window failed',
    desktopWindowUnsupportedMessage: 'This browser does not support the desktop window',
    desktopWindowOpenFailed: 'Unable to open the desktop window',
    petLabel: 'Harness Pet. Click to interact, double-click or long-press for settings.',
    openSettings: 'Open Harness Pet settings',
    closeDialog: 'Close dialog',
    expandFollowup: 'Open follow-up input',
    collapseFollowup: 'Close follow-up input',
    followupPlaceholder: 'Follow up',
    followupInputLabel: 'Follow-up message',
    sendFollowup: 'Send to the current Harness session',
    enterFollowup: 'Enter a follow-up message',
    currentSessionUnavailable: 'The current session cannot accept messages',
    sendFailed: 'Send failed',
    replying: 'Replying',
    waitingForYou: 'Waiting for you',
    processing: 'Processing',
    statuses: {
      idle: { label: 'idle', title: 'Harness Pet', subtitle: 'Ready' },
      thinking: { label: 'thinking', title: 'Preparing a reply', subtitle: 'Generating a reply…' },
      working: { label: 'working', title: 'Working on the task', subtitle: 'Harness is working on the task' },
      searching: { label: 'searching', title: 'Searching for information', subtitle: 'Searching for information' },
      bash: { label: 'bash', title: 'Running a command', subtitle: 'Running a command' },
      editing: { label: 'editing', title: 'Editing content', subtitle: 'Editing files' },
      waiting: { label: 'waiting', title: 'Your input is needed', subtitle: 'Waiting for your input' },
      error: { label: 'error', title: 'The task hit a problem', subtitle: 'Check the error details in Harness' },
      success: { label: 'success', title: 'Task complete', subtitle: 'Complete · Ready' },
    },
  },
  'zh-CN': {
    languageName: '简体中文',
    language: '语言',
    enablePet: '启用宠物',
    petSize: '宠物大小',
    opacity: '透明度',
    reducedMotion: '减少动画',
    debugState: '调试状态',
    autoCycle: '自动轮播',
    currentStatus: '当前状态',
    resetPosition: '重置位置',
    showDialog: '显示对话框',
    openDesktopWindow: '打开独立宠物窗口',
    desktopWindowUnsupported: '浏览器不支持独立宠物窗口',
    desktopWindowHint: '主 Harness 窗口最小化后宠物仍会显示；请保持浏览器运行。',
    returnToHarness: '返回 Harness',
    followHarness: '跟随 Harness',
    closeSettings: '关闭设置',
    settingsLabel: 'Harness Pet 设置',
    disclaimer: '这是一个非官方社区项目，与 DeepSeek 无隶属关系，也未经其认可或维护。',
    desktopWindowFailed: '打开桌面小窗失败',
    desktopWindowUnsupportedMessage: '当前浏览器不支持桌面小窗',
    desktopWindowOpenFailed: '无法打开桌面小窗',
    petLabel: 'Harness Pet。单击互动，双击或长按打开设置。',
    openSettings: '打开 Harness Pet 设置',
    closeDialog: '关闭对话框',
    expandFollowup: '展开继续跟进输入框',
    collapseFollowup: '收起继续跟进输入框',
    followupPlaceholder: '继续跟进',
    followupInputLabel: '继续跟进内容',
    sendFollowup: '发送到当前 Harness 会话',
    enterFollowup: '请输入继续跟进的内容',
    currentSessionUnavailable: '当前会话不可发送',
    sendFailed: '发送失败',
    replying: '正在回复',
    waitingForYou: '等待你的操作',
    processing: '正在处理',
    statuses: {
      idle: { label: '空闲', title: 'Harness Pet', subtitle: '就绪' },
      thinking: { label: '思考中', title: '正在组织回复', subtitle: '正在生成回复…' },
      working: { label: '工作中', title: '正在处理任务', subtitle: 'Harness 正在处理任务' },
      searching: { label: '搜索中', title: '正在搜索资料', subtitle: '正在搜索资料' },
      bash: { label: '命令中', title: '正在运行命令', subtitle: '正在运行命令' },
      editing: { label: '编辑中', title: '正在修改内容', subtitle: '正在修改文件' },
      waiting: { label: '等待中', title: '需要你的操作', subtitle: '等待你的操作' },
      error: { label: '错误', title: '任务遇到问题', subtitle: '请查看 Harness 中的错误信息' },
      success: { label: '已完成', title: '任务已完成', subtitle: '已完成 · 就绪' },
    },
  },
  'ja-JP': {
    languageName: '日本語',
    language: '言語',
    enablePet: 'ペットを有効化',
    petSize: 'ペットの大きさ',
    opacity: '不透明度',
    reducedMotion: '動きを減らす',
    debugState: 'デバッグ状態',
    autoCycle: '自動切り替え',
    currentStatus: '現在の状態',
    resetPosition: '位置をリセット',
    showDialog: '会話を表示',
    openDesktopWindow: 'フローティングペットを開く',
    desktopWindowUnsupported: 'フローティングペットは非対応です',
    desktopWindowHint: 'Harness を最小化してもペットは表示されます。ブラウザは起動したままにしてください。',
    returnToHarness: 'Harness に戻す',
    followHarness: 'Harness に追従',
    closeSettings: '設定を閉じる',
    settingsLabel: 'Harness Pet の設定',
    disclaimer: 'これは非公式のコミュニティプロジェクトです。DeepSeek との提携関係はなく、承認・保守も受けていません。',
    desktopWindowFailed: 'デスクトップ小窓を開けませんでした',
    desktopWindowUnsupportedMessage: 'このブラウザはデスクトップ小窓に対応していません',
    desktopWindowOpenFailed: 'デスクトップ小窓を開けません',
    petLabel: 'Harness Pet。クリックで反応、ダブルクリックまたは長押しで設定を開きます。',
    openSettings: 'Harness Pet の設定を開く',
    closeDialog: '会話を閉じる',
    expandFollowup: '追加メッセージ入力を開く',
    collapseFollowup: '追加メッセージ入力を閉じる',
    followupPlaceholder: '追加で送信',
    followupInputLabel: '追加メッセージ',
    sendFollowup: '現在の Harness セッションに送信',
    enterFollowup: '追加メッセージを入力してください',
    currentSessionUnavailable: '現在のセッションには送信できません',
    sendFailed: '送信に失敗しました',
    replying: '返信中',
    waitingForYou: '操作を待っています',
    processing: '処理中',
    statuses: {
      idle: { label: '待機', title: 'Harness Pet', subtitle: '準備完了' },
      thinking: { label: '思考中', title: '返信を考えています', subtitle: '返信を生成中…' },
      working: { label: '作業中', title: 'タスクを処理中', subtitle: 'Harness がタスクを処理中' },
      searching: { label: '検索中', title: '資料を検索中', subtitle: '資料を検索中' },
      bash: { label: '実行中', title: 'コマンドを実行中', subtitle: 'コマンドを実行中' },
      editing: { label: '編集中', title: '内容を編集中', subtitle: 'ファイルを変更中' },
      waiting: { label: '入力待ち', title: '操作が必要です', subtitle: '操作を待っています' },
      error: { label: 'エラー', title: 'エラーが発生しました', subtitle: 'Harness のエラー情報を確認してください' },
      success: { label: '完了', title: 'タスクが完了しました', subtitle: '完了 · 準備完了' },
    },
  },
  'ko-KR': {
    languageName: '한국어',
    language: '언어',
    enablePet: '펫 사용',
    petSize: '펫 크기',
    opacity: '불투명도',
    reducedMotion: '모션 줄이기',
    debugState: '디버그 상태',
    autoCycle: '자동 순환',
    currentStatus: '현재 상태',
    resetPosition: '위치 초기화',
    showDialog: '대화창 표시',
    openDesktopWindow: '플로팅 펫 열기',
    desktopWindowUnsupported: '플로팅 펫을 지원하지 않음',
    desktopWindowHint: 'Harness를 최소화해도 펫은 계속 표시됩니다. 브라우저는 실행 상태로 유지하세요.',
    returnToHarness: 'Harness로 돌아가기',
    followHarness: 'Harness 상태 따르기',
    closeSettings: '설정 닫기',
    settingsLabel: 'Harness Pet 설정',
    disclaimer: '이 프로젝트는 비공식 커뮤니티 프로젝트이며 DeepSeek와 제휴 관계가 없고, 승인 또는 유지보수를 받지 않습니다.',
    desktopWindowFailed: '데스크톱 창을 열지 못했습니다',
    desktopWindowUnsupportedMessage: '현재 브라우저는 데스크톱 창을 지원하지 않습니다',
    desktopWindowOpenFailed: '데스크톱 창을 열 수 없습니다',
    petLabel: 'Harness Pet. 클릭하면 반응하고, 두 번 클릭하거나 길게 누르면 설정이 열립니다.',
    openSettings: 'Harness Pet 설정 열기',
    closeDialog: '대화창 닫기',
    expandFollowup: '추가 메시지 입력창 열기',
    collapseFollowup: '추가 메시지 입력창 닫기',
    followupPlaceholder: '추가 메시지',
    followupInputLabel: '추가 메시지 내용',
    sendFollowup: '현재 Harness 세션으로 보내기',
    enterFollowup: '추가 메시지를 입력하세요',
    currentSessionUnavailable: '현재 세션에는 보낼 수 없습니다',
    sendFailed: '전송에 실패했습니다',
    replying: '답변 중',
    waitingForYou: '사용자 작업 대기 중',
    processing: '처리 중',
    statuses: {
      idle: { label: '대기', title: 'Harness Pet', subtitle: '준비됨' },
      thinking: { label: '생각 중', title: '답변을 준비 중입니다', subtitle: '답변 생성 중…' },
      working: { label: '작업 중', title: '작업 처리 중', subtitle: 'Harness가 작업을 처리 중입니다' },
      searching: { label: '검색 중', title: '자료 검색 중', subtitle: '자료 검색 중' },
      bash: { label: '실행 중', title: '명령 실행 중', subtitle: '명령 실행 중' },
      editing: { label: '편집 중', title: '내용 수정 중', subtitle: '파일 수정 중' },
      waiting: { label: '입력 대기', title: '사용자 작업이 필요합니다', subtitle: '사용자 작업을 기다리는 중' },
      error: { label: '오류', title: '작업 중 문제가 발생했습니다', subtitle: 'Harness의 오류 정보를 확인하세요' },
      success: { label: '완료', title: '작업이 완료되었습니다', subtitle: '완료 · 준비됨' },
    },
  },
}

export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && (UI_LANGUAGES as readonly string[]).includes(value)
}

export function uiCopy(language: UiLanguage): UiCopy {
  return COPY[language]
}
