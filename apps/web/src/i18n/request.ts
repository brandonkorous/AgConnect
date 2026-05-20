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
        // Tierra audience is the California Central Valley. Without this,
        // next-intl falls back to the server runtime (UTC on GKE) and every
        // timestamp renders 7–8 hours shifted — e.g. a 5:55 AM clock-in shows
        // as 12:55 PM. America/Los_Angeles handles PST/PDT automatically.
        timeZone: 'America/Los_Angeles',
    };
});
