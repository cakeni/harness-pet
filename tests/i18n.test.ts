import { describe, expect, it } from 'vitest'
import { isUiLanguage, UI_LANGUAGES, uiCopy } from '../src/i18n.js'
import { petDialogPresentation, progressLabel } from '../src/pet/index.js'

describe('interface languages', () => {
  it('ships English by default plus Chinese, Japanese, and Korean', () => {
    expect(UI_LANGUAGES).toEqual(['en-US', 'zh-CN', 'ja-JP', 'ko-KR'])
    expect(UI_LANGUAGES.map((language) => uiCopy(language).languageName)).toEqual([
      'English',
      '简体中文',
      '日本語',
      '한국어',
    ])
  })

  it('localizes settings, states, dialogs, and progress labels', () => {
    expect(uiCopy('en-US').enablePet).toBe('Enable Pet')
    expect(uiCopy('en-US').settingsLabel).toBe('Harness Pet settings')
    expect(uiCopy('zh-CN').statuses.idle.title).toBe('Harness Pet')
    expect(uiCopy('zh-CN').enablePet).toBe('启用宠物')
    expect(uiCopy('ja-JP').statuses.error.label).toBe('エラー')
    expect(uiCopy('ko-KR').showDialog).toBe('대화창 표시')
    expect(uiCopy('zh-CN').desktopWindowHint).toContain('最小化')
    expect(petDialogPresentation('success', undefined, 'ja-JP').subtitle).toBe('完了 · 準備完了')
    expect(progressLabel('thinking', 'ko-KR')).toBe('답변 중')
  })

  it('rejects unknown stored language values', () => {
    expect(isUiLanguage('en-US')).toBe(true)
    expect(isUiLanguage('fr-FR')).toBe(false)
  })
})
