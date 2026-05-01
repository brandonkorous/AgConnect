import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { getMessages, type Locale } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = (hasLocale(routing.locales, requested) ? requested : routing.defaultLocale) as Locale;

    return {
        locale,
        messages: await getMessages(locale, null),
    };
});
