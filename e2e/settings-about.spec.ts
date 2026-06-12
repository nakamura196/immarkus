import { Page, expect, test } from '@playwright/test';
import { findRawTranslationKeys, mockWorkFolder, openWorkFolder, setLanguage } from './helpers';

/**
 * i18n coverage for the SETTINGS (ns `settings`), ABOUT (ns `about`) and
 * X-MARKUS (ns `markus`) pages.
 *
 * All three routes live behind the work-folder gate (src/App.tsx renders
 * <Start> for every path until a store exists), so each test opens the
 * mocked work folder first and then navigates via the (already translated)
 * sidebar — no reloads, so the addInitScript/setLanguage gotcha never bites.
 */

// App boot through the Vite dev server takes ~30s when all tests in this
// file run in parallel workers, which intermittently trips the default 30s
// test timeout inside the openWorkFolder helper. Give each test headroom.
test.describe.configure({ timeout: 90_000 });

/** Boots the app in the given language and opens the mocked work folder. */
const boot = async (page: Page, lang: 'en' | 'ja'): Promise<string[]> => {
  const pageErrors: string[] = [];
  page.on('pageerror', err => pageErrors.push(String(err)));

  await setLanguage(page, lang);
  await mockWorkFolder(page);
  await page.goto('/');
  await openWorkFolder(page);

  return pageErrors;
};

/**
 * The About and X-MARKUS pages render real URLs as link texts
 * (immarkus.xmarkus.org, dh.chinese-empires.eu, doi.org/...) which the
 * dotted-word heuristic in findRawTranslationKeys cannot tell apart from
 * raw i18n keys. Anything that appears inside an <a> is a URL by design,
 * so subtract link texts before asserting emptiness.
 */
const expectNoRawKeys = async (page: Page) => {
  const candidates = await findRawTranslationKeys(page);
  if (candidates.length === 0) {
    expect(candidates).toEqual([]);
    return;
  }
  const linkTexts = (await page.locator('a').allInnerTexts()).join('\n');
  expect(candidates.filter(c => !linkTexts.includes(c))).toEqual([]);
};

test.describe('settings page', () => {

  test('renders Japanese title, description, nav and NoIndex state', async ({ page }) => {
    const pageErrors = await boot(page, 'ja');

    await page.getByRole('link', { name: '設定', exact: true }).click();
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();

    // settings.description
    await expect(page.getByText('アプリケーション全体の設定です。')).toBeVisible();

    // settings.nav.visualSearch — scoped to the settings sub-nav, because
    // noIndex.intro1 also renders a bold "ビジュアル検索" in the prose
    await expect(page.locator('main aside nav').getByText('ビジュアル検索', { exact: true })).toBeVisible();

    // Visual search index state: the freshly mocked folder has no index,
    // so the NoIndex block renders (noIndex.* strings). The state resolves
    // asynchronously (openIndex on OPFS), hence the generous first timeout.
    await expect(
      page.getByRole('button', { name: '1 件の画像のインデックスを開始' })
    ).toBeVisible({ timeout: 15000 });

    // noIndex.intro1 (Trans with <b>/<wsIcon> components — match plain-text head)
    await expect(page.getByText('例示に基づいて画像内のオブジェクトを見つけられます')).toBeVisible();
    // noIndex.intro2
    await expect(page.getByText('ビジュアル検索を使う前に、画像のインデックス作成が必要です。')).toBeVisible();
    // noIndex.advancedOptions (two segmenters configured in public/config.json)
    await expect(page.getByRole('button', { name: '詳細オプション' })).toBeVisible();
    // noIndex.footnote
    await expect(page.getByText('画像が外部サービスにアップロードされることはありません')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

  test('renders English title, description, nav and NoIndex state', async ({ page }) => {
    const pageErrors = await boot(page, 'en');

    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await expect(page.getByText('Application-wide settings and configuration.')).toBeVisible();
    await expect(page.locator('main aside nav').getByText('Visual Search', { exact: true })).toBeVisible();

    // noIndex.startButton_one — singular form (one seeded image)
    await expect(
      page.getByRole('button', { name: 'Start indexing 1 image' })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('your images need to be indexed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Advanced Options' })).toBeVisible();
    await expect(page.getByText('does not upload your images to external services')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

});

test.describe('about page', () => {

  test('renders Japanese title, prose and image alt texts', async ({ page }) => {
    const pageErrors = await boot(page, 'ja');

    // "IMMARKUS" sub-item under the (translated) "情報" sidebar group
    await page.getByRole('link', { name: 'IMMARKUS', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'IMMARKUS について' })).toBeVisible();

    // about.developedBy (Trans — match the plain-text tail)
    await expect(page.getByText('によって開発されました')).toBeVisible();

    // about.citation.*
    await expect(page.getByText('研究や教育で本ソフトウェアを引用する際は')).toBeVisible();
    await expect(page.getByText('プラットフォーム', { exact: true })).toBeVisible();
    await expect(page.getByText('コード', { exact: true })).toBeVisible();
    await expect(page.getByText('利用手順', { exact: true })).toBeVisible();

    // about.logos.* (img alt texts)
    await expect(page.getByAltText('KU Leuven のロゴ')).toBeVisible();
    await expect(page.getByAltText('欧州研究会議 (ERC) のロゴ')).toBeVisible();
    await expect(page.getByAltText('欧州旗')).toBeVisible();

    // Citations and the ERC funding statement stay in their original
    // language BY DESIGN — assert they are still there, untranslated.
    await expect(page.getByText('IMMARKUS: Image Annotation. 2024.')).toBeVisible();
    await expect(page.getByText('European Research Council (ERC) under the European Union')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

  test('renders English title and citation labels', async ({ page }) => {
    const pageErrors = await boot(page, 'en');

    await page.getByRole('link', { name: 'IMMARKUS', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'About IMMARKUS' })).toBeVisible();

    await expect(page.getByText('has been developed by Prof. Dr. Hilde De Weerdt')).toBeVisible();
    await expect(page.getByText('Platform', { exact: true })).toBeVisible();
    await expect(page.getByText('Code', { exact: true })).toBeVisible();
    await expect(page.getByText('Instructions', { exact: true })).toBeVisible();
    await expect(page.getByAltText('KU Leuven logo')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

});

test.describe('x-markus page', () => {

  test('renders Japanese intro/materials, keeps X-MARKUS heading and credits verbatim', async ({ page }) => {
    const pageErrors = await boot(page, 'ja');

    await page.getByRole('link', { name: 'X-MARKUS', exact: true }).click();

    // Heading stays "X-MARKUS" verbatim by design
    await expect(page.getByRole('heading', { name: 'X-MARKUS', exact: true })).toBeVisible();

    // markus.intro
    await expect(page.getByText('クロスメディアアノテーション環境 X-MARKUS の一部です')).toBeVisible();
    // markus.materials
    await expect(page.getByText('各プラットフォームには解説資料が用意されています')).toBeVisible();

    // Platform credits stay in their original language by design
    await expect(page.getByText('MARKUS: Text Analysis and Reading Platform.')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

  test('renders English intro/materials', async ({ page }) => {
    const pageErrors = await boot(page, 'en');

    await page.getByRole('link', { name: 'X-MARKUS', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'X-MARKUS', exact: true })).toBeVisible();

    await expect(page.getByText('a cross-media annotation environment consisting of:')).toBeVisible();
    await expect(page.getByText('All platforms feature instructional materials')).toBeVisible();

    await expectNoRawKeys(page);
    expect(pageErrors).toEqual([]);
  });

});
