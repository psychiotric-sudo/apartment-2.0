# Apartment Dashboard - PWA Installation Guide

## Files Included

### Core Application

- **dashboard.html** - Main application file (renamed from original)
- **manifest.json** - PWA manifest file
- **sw.js** - Service Worker for offline support
- **.htaccess** - Web server configuration (for Apache)

## What is a PWA?

A Progressive Web App (PWA) is a web application that works offline and can be installed on devices like a native app. The Apartment Dashboard is fully configured as a PWA.

## Features

✅ **Offline Support** - Works without internet connection
✅ **Installable** - Add to home screen on phones and desktops
✅ **Fast Loading** - Cached assets load instantly
✅ **Data Persistence** - All data stored locally via localStorage
✅ **Responsive Design** - Works on all screen sizes

## Installation on Website

### 1. Upload Files

Upload all files to your web server:

```
/dashboard.html
/manifest.json
/sw.js
/.htaccess
```

### 2. Configure Your Server

**For Apache:**

- Ensure `.htaccess` support is enabled
- Modules `mod_rewrite` and `mod_headers` must be enabled
- Verify HTTPS is enabled (required for PWA)

**For Nginx:**

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/apartment/dashboard;

    location / {
        try_files $uri /dashboard.html;
        add_header Cache-Control "public, max-age=3600";
    }

    location ~ \.(js|css|json|svg)$ {
        add_header Cache-Control "public, max-age=2592000";
    }

    location ~ \.(html)$ {
        add_header Cache-Control "public, max-age=0";
    }
}
```

**For PHP-based hosts:**

- Use `.htaccess` as provided
- Ensure your host supports HTTPS
- No additional configuration needed

### 3. HTTPS Requirement

PWA features require HTTPS. If your host doesn't have SSL yet:

- Use Let's Encrypt (free SSL)
- Or contact your hosting provider for SSL setup
- **Note:** localhost development works without HTTPS

### 4. Testing Locally

Open the file directly in your browser for testing:

```
file:///path/to/dashboard.html
```

Or use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000/dashboard.html`

## How to Install (User-Facing)

### On Chrome/Edge (Android & Desktop)

1. Open the dashboard in your browser
2. Look for "Install" button (top right menu or address bar)
3. Click "Install"
4. The app will appear on your home screen/apps menu

### On Safari (iOS)

1. Open the dashboard in Safari
2. Tap the Share button (bottom)
3. Select "Add to Home Screen"
4. Tap "Add"

### On Safari (macOS)

1. Open the dashboard in Safari
2. Menu: File → "Add to Dock"
3. The app will appear in your dock

## Customization

### Change App Name

Edit `manifest.json`:

```json
"name": "Your App Name",
"short_name": "Short Name"
```

### Change Colors

Edit `manifest.json`:

```json
"theme_color": "#6c8cff",
"background_color": "#0f1117"
```

### Change Icons

Replace the SVG icons in `manifest.json` with your own image URLs or base64 data URIs.

## Troubleshooting

### App won't install

- ❌ Not on HTTPS (except localhost)
- ✅ Solution: Enable HTTPS on your domain

### Service Worker not registering

- ❌ Browser console shows errors
- ✅ Check: Browser supports Service Workers? (All modern browsers do)
- ✅ Check: Files are accessible via HTTPS

### Data not persisting

- ❌ Browser storage disabled or incognito mode
- ✅ Solution: Use normal browsing mode

### Offline doesn't work

- ❌ App never loaded successfully online
- ✅ Solution: Load app once while online to cache it

## Browser Support

| Feature        | Chrome | Firefox | Safari | Edge |
| -------------- | ------ | ------- | ------ | ---- |
| Install        | ✅     | ✅      | ✅     | ✅   |
| Offline        | ✅     | ✅      | ✅     | ✅   |
| Service Worker | ✅     | ✅      | ✅     | ✅   |
| localStorage   | ✅     | ✅      | ✅     | ✅   |

## Security Notes

- ✅ All data stored locally in browser
- ✅ No data sent to external servers
- ✅ HTTPS ensures secure installation
- ✅ Service Worker only caches HTML/JS/CSS files

## Support

For issues related to PWA deployment:

1. Check browser console (F12) for errors
2. Verify HTTPS is working
3. Clear cache and reinstall
4. Try a different browser

---

**Happy organizing! 🎉**
