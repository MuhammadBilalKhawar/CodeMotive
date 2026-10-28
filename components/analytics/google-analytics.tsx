"use client"

import Script from "next/script"

export const gaId = process.env.NEXT_PUBLIC_GA_ID
export const CONSENT_KEY = "cm-consent"

// Google Analytics 4 with Consent Mode v2. Analytics storage starts denied for
// everyone (GA only sends cookieless pings) and is granted when the visitor
// accepts in the consent banner. gtag.js loads when the browser is idle, so
// it doesn't slow the page. Renders nothing without NEXT_PUBLIC_GA_ID.
export function GoogleAnalytics() {
  if (!gaId) return null
  const init = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
try { if (localStorage.getItem('${CONSENT_KEY}') === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' }); } catch (e) {}
gtag('js', new Date());
gtag('config', '${gaId}');`
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {init}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
    </>
  )
}
