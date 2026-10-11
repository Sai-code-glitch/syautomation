# SYAUTOMATION website

A fast, static, multi-page website. There's no framework and nothing to install for hosting: upload this folder and it works.

## Pages
Home, Services (24 services with prices), Industries (8 playbooks), Pricing (plans, comparison table, add-ons, billing FAQ),
About, Security & Privacy, Partners, Contact (audit booking form with time slots in the visitor's time zone),
Privacy Policy, Terms, Cookie Policy and a 404 page.

## Built in
- 6 languages: English, Spanish, French, German, Arabic (right-to-left) and Hindi. Header, footer, cookie banner, chat and the full home page are translated; other pages are English. Have a native speaker check the translations.
- 8 currencies (USD, GBP, EUR, AUD, CAD, AED, SGD, INR), picked automatically from the visitor's time zone, with fair regional pricing for India.
- Light and dark themes, following the visitor's device or their choice.
- Cookie consent banner (accept, reject, choose). Analytics only load after consent; paste your snippet into `loadAnalytics()` in `assets/app.js`.
- Demo AI chat assistant on every page that answers pricing, timeline, country, security and industry questions.
- Busywork savings calculator and live workflow demo on the home page.
- Forms for audit bookings, partner applications and the newsletter, ready for Netlify Forms.
- SEO: unique titles and descriptions, canonical URLs, Open Graph and Twitter cards, social image, JSON-LD structured data (organisation, services, FAQ, breadcrumbs), sitemap.xml and robots.txt.
- Accessibility: skip link, keyboard focus styles, labelled controls, reduced-motion support.
- Security headers (netlify.toml / _headers) and /.well-known/security.txt.

## Before you go live, replace
Edit the `SITE` block at the top of `_build/build.js`, then run `node _build/build.js` from this folder. That updates every page at once:
- domain, email, phone and WhatsApp number
- social links (LinkedIn, Instagram, YouTube, X)
- registered company name and address
Also:
- The three customer stories on the home page are examples. Replace them with real results.
- Add your photo and background on the About page.
- Fill in "[your jurisdiction]" in terms.html and have a lawyer review the privacy policy and terms.
- security@syautomation.com on the Security page and in .well-known/security.txt.
- If you don't build first, you can edit the HTML files directly instead. Running the build overwrites them from `_build/pages/`.

## Put it online (free)
Netlify (recommended, forms work automatically):
1. Go to app.netlify.com/drop and drag this whole folder onto the page.
2. In Site settings > Domain management, add your domain.
3. Form submissions appear under Forms in your Netlify dashboard. Turn on email notifications there.

Other options: GitHub Pages, Vercel or Cloudflare Pages all host it as-is. On those, connect the forms to a service such as Formspree by changing the fetch URL in `assets/app.js`.
