# PWA Testing Checklist

## Pre-Deployment

- [x] Web manifest created at `/public/site.webmanifest`
- [x] Manifest linked in root layout
- [x] Offline page created at `/src/app/offline/page.tsx`
- [x] Sitemap generated at `/src/app/sitemap.ts`
- [x] Robots.txt configured
- [ ] PWA icons generated (72, 96, 128, 144, 152, 192, 384, 512px)
- [ ] Icons placed in `/public/icons/`

## Post-Deployment Testing

### 1. Manifest Validation
- [ ] Visit: `https://solutions.jkkn.ai/site.webmanifest`
- [ ] Verify JSON is valid and displays correctly
- [ ] Check all properties are present

### 2. Lighthouse PWA Audit
- [ ] Open DevTools > Lighthouse
- [ ] Run PWA audit
- [ ] Check for passing scores:
  - [ ] Installable (requires icons)
  - [ ] PWA optimized
  - [ ] Configured for custom splash screen
  - [ ] Themed address bar

### 3. Install Prompt (Chrome/Edge)
- [ ] Visit site in Chrome/Edge
- [ ] Look for install icon in address bar
- [ ] Click to install
- [ ] Verify app opens in standalone window
- [ ] Check app shortcuts (right-click on installed app)

### 4. Sitemap
- [ ] Visit: `https://solutions.jkkn.ai/sitemap.xml`
- [ ] Verify all pages listed
- [ ] Check lastModified dates
- [ ] Verify priority values (1.0 for home, 0.8 for others)

### 5. Robots.txt
- [ ] Visit: `https://solutions.jkkn.ai/robots.txt`
- [ ] Verify allows all user agents
- [ ] Check sitemap reference
- [ ] Confirm /api/ and /admin/ are disallowed

### 6. Offline Functionality
- [ ] Install PWA
- [ ] Open DevTools > Network > Set to Offline
- [ ] Navigate to any page
- [ ] Should see offline page with "You're Offline" message
- [ ] Click "Try Again" button
- [ ] Should attempt reload

### 7. Mobile Testing
- [ ] Open on Android Chrome
- [ ] Check for "Add to Home Screen" prompt
- [ ] Install and launch
- [ ] Verify standalone mode (no browser UI)
- [ ] Test on iOS Safari (limited support)

### 8. Meta Tags
- [ ] View page source
- [ ] Verify theme-color meta tag
- [ ] Check viewport meta tag
- [ ] Verify manifest link

### 9. Performance
- [ ] Check page load times
- [ ] Verify no console errors
- [ ] Test on 3G network (throttle in DevTools)

### 10. App Shortcuts
- [ ] Right-click installed PWA icon (Desktop)
- [ ] Verify 3 shortcuts appear:
  - [ ] Dashboard
  - [ ] Solutions
  - [ ] Clients
- [ ] Click each shortcut and verify navigation

## Known Limitations

- **iOS Safari**: No install prompt, limited PWA support
- **Firefox**: Partial PWA support, no install prompt
- **Without Icons**: Install prompt won't appear

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No install prompt | Ensure all icons are present and manifest is valid |
| Manifest not loading | Check manifest path in layout.tsx |
| Offline page not showing | Add service worker for offline caching |
| Icons not displaying | Verify icon paths and file sizes match manifest |

## Resources

- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN Web Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Chrome PWA Install Criteria](https://web.dev/install-criteria/)

---

**Last Updated:** 2026-02-02
