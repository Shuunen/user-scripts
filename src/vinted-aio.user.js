// ==UserScript==
// @name         Vinted AIO
// @author       Romain Racamier-Lafon
// @description  Hide unwanted elements and add features on Vinted
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/vinted-aio.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/vinted-aio.user.js
// @grant        none
// @match        https://www.vinted.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vinted.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @version      1.0.0
// ==/UserScript==

const styles = `
  :root {
    --v-aio-dark: 14,14,14;
    --v-aio-light: 180,180,180;
    --greyscale-level-5: var(--v-aio-dark);
    --greyscale-level-6: var(--v-aio-dark);
    --greyscale-level-7: var(--v-aio-light);
    --greyscale-level-2: var(--v-aio-light);
    --greyscale-level-1: var(--v-aio-light);
    --muted-default: var(--v-aio-light);
    --amplified-default: var(--v-aio-light);
    --primary-default: 130,210,210;
    --primary-extra-light: var(--primary-default);
  }
  button {
    color: rgb(var(--v-aio-dark));
  }
  .web_ui__Chip__outlined {
    background-color: rgb(var(--v-aio-light));
  }
  .checkout__pay-button__container{
    background-color: rgb(var(--v-aio-dark));
  }
  .web_ui__Card__card,
  .shipping-discount-banner,
  .u-background-white {
    background: rgba(0,0,0,0.5);
    border: none;
  }
  .u-background-white,
  .web_ui__Text__amplified {
    color: inherit;
  }
  .is-wide .container {
    width: 1600px;
  }
`

function VintedAio() {
  const utils = new Shuutils('vinted-hide-selector')
  utils.injectStyles(styles)
  const uselessSelectors = {
    'around-price': '[data-testid="service-fee-included-title"], [data-testid="service-fee-included-icon"]',
    'favorite-link': '[href="/member/items/favourite_list"]',
    // 'follow-button': '[role="presentation"] > .web_ui__Cell__content > .web_ui__Cell__body > button.web_ui__Button__truncated',
    'help-link': '[href="/help/360?access_channel=vinted_guide"]',
    'law-text': '[data-testid="item-transparency-law--content"]',
    promoted: '.feed-grid > .feed-grid__item.feed-grid__item--full-row',
    'protection-text': '.item-page-sidebar-content > .web_ui__Card__card.web_ui__Card__overflowAuto:first-child + .web_ui__Card__card.web_ui__Card__overflowAuto',
    'sell-button': '[href="/items/new"]',
    'sidebar-discount': '[data-testid="item-sidebar-price-container"] > [data-testid="discount-badges-container"]',
    spacer: '.web_ui__Spacer__x5-large.web_ui__Spacer__horizontal',
    'useless-base-price': '[data-testid="item-price"]',
  }
  /**
   * Process the page and hide elements
   * @param {string} reason - The reason for processing
   */
  function start(reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
  }
  const startDebounceTime = 300
  const startDebounced = utils.debounce((/** @type {string} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => start('initial-dom-loaded'))
  start('initial-dom-ready')
}

if (globalThis.window) VintedAio()
