import { useTranslation } from 'react-i18next';
import { AppNavigationSidebar } from '@/components/AppNavigationSidebar';
import { VisualSearch } from './visualsearch';
import { Separator } from '@/ui/Separator';

export const Settings = () => {

  const { t } = useTranslation('settings');

  return (
    <>
      <AppNavigationSidebar />

      <main className="grow page export px-12 py-6 overflow-auto">
        <div>
        <h1 className="text-xl font-semibold tracking-tight mb-2">
          {t('title')}
        </h1>

        <p className="mt-1 text-sm leading-6">
          {t('description')}
        </p>
        
        <Separator className="mt-7 w-full mb-2" /> 
        </div>

        <div className="flex">
          <aside className="py-4">
            <nav className="w-44">
              <ol>
                <li className="block bg-muted px-3 py-1.5 rounded w-full my-2">
                  {t('nav.visualSearch')}
                </li>
              </ol>
            </nav>
          </aside>

          <section className="pl-12 py-0.5 grow">
            <VisualSearch />   
          </section>
        </div>
      </main>
    </>
  )

}