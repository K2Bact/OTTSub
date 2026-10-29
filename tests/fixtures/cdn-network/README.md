# Offline CDN network fixture

This self-signed certificate and deliberately public test key are used only by
test_cdn_permissions_browser.cjs on loopback. They are not service credentials,
trusted certificates, production assets or a store package input. The test
browser ignores certificate errors and connects through a local proxy that
allows only the synthetic Netflix/CDN host names and never forwards to the
internet. Native browser CORS still runs; Playwright route fulfillment is not
used for the fetch comparison.
