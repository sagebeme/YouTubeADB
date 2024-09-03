// ==UserScript==
// @name         YouTube Ad Blocker
// @namespace    https://github.com/sagebeme/YouTubeADB
// @version      6.03
// @description  This script removes ads on YouTube, it's lightweight and efficient, capable of smoothly removing interface and video ads, including 6s ads.
// @author       Ngare Macharia
// @match        *://*.youtube.com/*
// @exclude      *://accounts.youtube.com/*
// @exclude      *://www.youtube.com/live_chat_replay*
// @exclude      *://www.youtube.com/persist_identity*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=YouTube.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Interface advertisement selectors
    const cssSelectorArr = [
        '#masthead-ad', // Homepage top banner ad.
        'ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)', // Homepage video layout ad.
        '.video-ads.ytp-ad-module', // Player bottom ad.
        'tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)', // Player page member promotion ad.
        'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]', // Player page top right recommendation ad.
        '#related #player-ads', // Player page comment area right promotion ad.
        '#related ytd-ad-slot-renderer', // Player page comment area right video layout ad.
        'ytd-ad-slot-renderer', // Search page ad.
        'yt-mealbar-promo-renderer', // Player page member recommendation ad.
        'ad-slot-renderer', // Mobile player third-party recommendation ad.
        'ytm-companion-ad-renderer', // Mobile skippable video ad link
    ];

    window.dev = false; // Development use

    /**
    * Format standard time
    * @param {Date} time Standard time
    * @param {String} format Format
    * @return {String}
    */
    function moment(time) {
        // Get year, month, day, hour, minute, and second
        let y = time.getFullYear();
        let m = (time.getMonth() + 1).toString().padStart(2, '0');
        let d = time.getDate().toString().padStart(2, '0');
        let h = time.getHours().toString().padStart(2, '0');
        let min = time.getMinutes().toString().padStart(2, '0');
        let s = time.getSeconds().toString().padStart(2, '0');
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }

    /**
    * Output information
    * @param {String} msg Information
    * @return {undefined}
    */
    function log(msg) {
        if (!window.dev) {
            return false;
        }
        console.log(window.location.href);
        console.log(`${moment(new Date())}  ${msg}`);
    }

    /**
    * Set run flag
    * @param {String} name
    * @return {undefined}
    */
    function setRunFlag(name) {
        let style = document.createElement('style');
        style.id = name;
        (document.querySelector('head') || document.querySelector('body')).appendChild(style);
    }

    /**
    * Get run flag
    * @param {String} name
    * @return {undefined|Element}
    */
    function getRunFlag(name) {
        return document.getElementById(name);
    }

    /**
    * Check if the run flag is set
    * @param {String} name
    * @return {Boolean}
    */
    function checkRunFlag(name) {
        if (getRunFlag(name)) {
            return true;
        } else {
            setRunFlag(name);
            return false;
        }
    }

    /**
    * Generate CSS style elements to remove ads and append them to HTML nodes
    * @param {String} styles Style text
    * @return {undefined}
    */
    function generateRemoveADHTMLElement(id) {
        // If already set, exit.
        if (checkRunFlag(id)) {
            log('Blocked page ad node already generated');
            return false;
        }

        // Set remove ad style.
        let style = document.createElement('style');
        (document.querySelector('head') || document.querySelector('body')).appendChild(style);
        style.appendChild(document.createTextNode(generateRemoveADCssText(cssSelectorArr)));
        log('Successfully generated blocked page ad node');
    }

    /**
    * Generate CSS text to remove ads
    * @param {Array} cssSelectorArr Array of CSS selectors to be set
    * @return {String}
    */
    function generateRemoveADCssText(cssSelectorArr) {
        cssSelectorArr.forEach((selector, index) => {
            cssSelectorArr[index] = `${selector}{display:none!important}`;
        });
        return cssSelectorArr.join(' ');
    }

    /**
    * Touch event
    * @return {undefined}
    */
    function nativeTouch() {
        // Create Touch object
        let touch = new Touch({
            identifier: Date.now(),
            target: this,
            clientX: 12,
            clientY: 34,
            radiusX: 56,
            radiusY: 78,
            rotationAngle: 0,
            force: 1
        });

        // Create TouchEvent object
        let touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch]
        });

        // Dispatch touchstart event to target element
        this.dispatchEvent(touchStartEvent);

        // Create TouchEvent object
        let touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: [],
            targetTouches: [],
            changedTouches: [touch]
        });

        // Dispatch touchend event to target element
        this.dispatchEvent(touchEndEvent);
    }

    /**
    * Skip ad
    * @return {undefined}
    */
    function skipAd(mutationsList, observer) {
        let video = document.querySelector('.ad-showing video') || document.querySelector('video');
        let skipButton = document.querySelector('.ytp-ad-skip-button') || document.querySelector('.ytp-skip-ad-button') || document.querySelector('.ytp-ad-skip-button-modern');
        let shortAdMsg = document.querySelector('.video-ads.ytp-ad-module .ytp-ad-player-overlay') || document.querySelector('.ytp-ad-button-icon');

        if (skipButton) {
            // Mute on mobile has a bug
            if (window.location.href.indexOf("https://m.youtube.com/") === -1) {
                video.muted = true;
            }
            if (video.currentTime > 0.5) {
                video.currentTime = video.duration;
                log('Special account skipped button ad ~~~~~~~~~~~~~');
                return;
            }
            skipButton.click(); // PC
            nativeTouch.call(skipButton); // Phone
            log('Button skipped ad ~~~~~~~~~~~~~');
        } else if (shortAdMsg) {
            video.currentTime = video.duration;
            log('Forcefully ended the ad ~~~~~~~~~~~~~');
        } else {
            log('###### Ad does not exist ######');
        }
    }

    /**
    * Remove ads during playback
    * @return {undefined}
    */
    function removePlayerAD(id) {
        // If already running, exit.
        if (checkRunFlag(id)) {
            log('Removing ads during playback function is already running');
            return false;
        }
        let observer;
        let timerID;

        // Start observing
        function startObserve() {
            // Advertisement node listening
            const targetNode = document.querySelector('.video-ads.ytp-ad-module');
            if (!targetNode) {
                log('Finding the target node to be monitored');
                return false;
            }
            // Listen to and handle ads in videos
            const config = { childList: true, subtree: true };
            observer = new MutationObserver(skipAd);
            observer.observe(targetNode, config);
            timerID = setInterval(skipAd, 500); // Missed
        }

        // Polling task
        let startObserveID = setInterval(() => {
            if (observer && timerID) {
                clearInterval(startObserveID);
            } else {
                startObserve();
            }
        }, 16);

        log('Successfully running remove ads during playback function');
    }

    /**
    * Main function
    */
    function main() {
        generateRemoveADHTMLElement('removeADHTMLElement'); // Remove ads from the interface.
        removePlayerAD('removePlayerAD'); // Remove ads during playback.
    }

    if (document.readyState === 'loading') {
        log('YouTube ad removal script is about to be invoked:');
        document.addEventListener('DOMContentLoaded', main);
    } else {
        log('YouTube ad removal script invoked quickly:');
        main();
    }

})();
