import { expect, test, Page } from '@playwright/test';
import { findRawTranslationKeys, mockWorkFolder, openWorkFolder, setLanguage } from './helpers';

/**
 * i18n verification for the DATA MODEL page (namespace `datamodel`) and the
 * EXPORT page (namespace `export`).
 *
 * Each test boots the app with a mocked work folder, collects uncaught page
 * errors, and asserts that no raw translation keys leak into visible text.
 */

const collectPageErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
};

const bootApp = async (page: Page, lang: 'en' | 'ja') => {
  await setLanguage(page, lang);
  await mockWorkFolder(page);
  await page.goto('/');
  await openWorkFolder(page);
};

/** Navigate via sidebar (avoids a full reload, keeping the in-memory store). */
const gotoDataModel = async (page: Page, lang: 'en' | 'ja') => {
  const label = lang === 'ja' ? 'データモデル' : 'Data Model';
  await page.getByRole('link', { name: label }).click();
  await page.waitForURL(/#\/model/);
};

const gotoExport = async (page: Page, lang: 'en' | 'ja') => {
  const label = lang === 'ja' ? 'エクスポート' : 'Export';
  await page.getByRole('link', { name: label }).click();
  await page.waitForURL(/#\/export\/annotations/);
};

test.describe('data model page', () => {

  test('shows localized title, tabs and entity classes tab (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoDataModel(page, 'ja');

    // Page title
    await expect(page.getByRole('heading', { name: 'データモデル' })).toBeVisible();

    // Tab labels
    await expect(page.getByRole('tab', { name: 'エンティティクラス' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'リレーション' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '画像メタデータ' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'フォルダメタデータ' })).toBeVisible();

    // Entity classes tab (default): description, empty state, buttons
    await expect(page.getByText('エンティティクラスを使って、アノテーションで特定の概念や事物を表し')).toBeVisible();
    await expect(page.getByText('エンティティクラスがありません')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規エンティティクラスを作成' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'モデルをインポート' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('relationships tab shows localized headers and empty state (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoDataModel(page, 'ja');

    await page.getByRole('tab', { name: 'リレーション' }).click();

    await expect(page.getByText('2 つのアノテーションはリレーションで結び付けられます')).toBeVisible();

    // Table headers
    await expect(page.getByRole('columnheader', { name: 'リレーション名' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '説明' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '有向' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ソースクラス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ターゲットクラス' })).toBeVisible();

    // Empty state and actions
    await expect(page.getByText('リレーションタイプが定義されていません')).toBeVisible();
    await expect(page.getByRole('button', { name: 'リレーションタイプを追加' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('image and folder metadata tabs show localized texts (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoDataModel(page, 'ja');

    // Image metadata tab
    await page.getByRole('tab', { name: '画像メタデータ' }).click();
    await expect(page.getByText('スキーマを使って、タイトル・作者・出典など、画像に関する構造化された情報を記録できます')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規画像スキーマ' })).toBeVisible();
    expect(await findRawTranslationKeys(page)).toEqual([]);

    // Folder metadata tab
    await page.getByRole('tab', { name: 'フォルダメタデータ' }).click();
    await expect(page.getByText('スキーマを使って、フォルダに関する構造化された情報を記録できます')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規フォルダスキーマ' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('entity class editor dialog is localized (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoDataModel(page, 'ja');

    await page.getByRole('button', { name: '新規エンティティクラスを作成' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('エンティティクラス *')).toBeVisible();
    await expect(dialog.getByText('表示名')).toBeVisible();
    await expect(dialog.getByText('親クラス')).toBeVisible();
    await expect(dialog.getByText('カラー')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'エンティティクラスを保存' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('spot checks in English', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'en');
    await gotoDataModel(page, 'en');

    await expect(page.getByRole('heading', { name: 'Data Model' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Entity Classes' })).toBeVisible();
    await expect(page.getByText('No entity classes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create New Entity Class' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

});

test.describe('export page', () => {

  test('shows localized title, description, nav and annotations section (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoExport(page, 'ja');

    const main = page.locator('main');

    // Title and description
    await expect(main.getByRole('heading', { name: 'エクスポート' })).toBeVisible();
    await expect(main.getByText('データをさまざまな形式でエクスポートできます。')).toBeVisible();

    // Section nav items
    await expect(main.getByRole('link', { name: 'アノテーション' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'リレーション' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'データモデル' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'メタデータ' })).toBeVisible();

    // Default section: annotations
    await expect(main.getByRole('heading', { name: 'アノテーションデータ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'アノテーションと画像' })).toBeVisible();
    await expect(main.getByText('W3C Web Annotation JSON-LD 形式のフラットなリストとして出力します')).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('each export section shows localized titles and descriptions (ja)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'ja');
    await gotoExport(page, 'ja');

    const main = page.locator('main');

    // Relationships section
    await main.getByRole('link', { name: 'リレーション' }).click();
    await page.waitForURL(/#\/export\/relationships/);
    await expect(main.getByRole('heading', { name: 'リレーションデータ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'リレーションと画像' })).toBeVisible();
    await expect(main.getByText('全画像のリレーションを Excel ファイルとして出力します')).toBeVisible();
    expect(await findRawTranslationKeys(page)).toEqual([]);

    // Data model section
    await main.getByRole('link', { name: 'データモデル' }).click();
    await page.waitForURL(/#\/export\/model/);
    await expect(main.getByRole('heading', { name: 'エンティティクラス' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'リレーションタイプ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: '画像メタデータスキーマ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'フォルダメタデータスキーマ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'IMMARKUS データモデル全体' })).toBeVisible();
    await expect(main.getByText('エンティティクラスのモデルを、IMMARKUS 独自の JSON 形式で出力します。')).toBeVisible();
    expect(await findRawTranslationKeys(page)).toEqual([]);

    // Metadata section
    await main.getByRole('link', { name: 'メタデータ' }).click();
    await page.waitForURL(/#\/export\/metadata/);
    await expect(main.getByRole('heading', { name: '画像メタデータ' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'フォルダメタデータ' })).toBeVisible();
    await expect(main.getByText('画像メタデータは 2 種類の形式で出力できます')).toBeVisible();
    await expect(main.getByText('フォルダメタデータは 2 種類の形式で出力できます')).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('spot checks in English', async ({ page }) => {
    const errors = collectPageErrors(page);
    await bootApp(page, 'en');
    await gotoExport(page, 'en');

    const main = page.locator('main');

    await expect(main.getByRole('heading', { name: 'Export' })).toBeVisible();
    await expect(main.getByText('Export your data in different export formats.')).toBeVisible();
    await expect(main.getByRole('link', { name: 'Annotations' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Relationships' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Data Model' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Metadata' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Annotation Data' })).toBeVisible();

    expect(await findRawTranslationKeys(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

});
