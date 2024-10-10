# Tab Manager Extension

Tab Manager is a Chrome extension that allows users to efficiently manage their open tabs. Users can open new tabs, pin tabs, mute/unmute all tabs, and close individual or all tabs directly from the popup interface

## Features
- Open New Tab: Quickly open a new tab with a single click.
- Pin/Unpin Tab: Pin the current tab to keep it always visible, or unpin it.
- Mute/Unmute All Tabs: Instantly mute or unmute audio across all open tabs.
- Close Individual Tabs: Close any specific tab directly from the popup.
- Close All Tabs: Close all open tabs with one click.

## Screenshots

## Installation

1. Clone or download this repository:

- git clone https://github.com/yourusername/tab-manager-extension.git
2. Open Chrome and navigate to chrome://extensions/.

3. Enable Developer Mode by toggling the switch in the top-right corner.

4. Click on Load unpacked and select the folder where you cloned or extracted this repository.

5. The extension should now be installed and visible in your Chrome toolbar.

## Usage
- Click the Tab Manager icon in your Chrome toolbar to open the extension popup.
- Use the buttons to manage your tabs:
    - Open New Tab: Opens a new tab.
    - Pin Tab: Pins or unpins the current tab.
    - Mute All Tabs: Mutes/unmutes all open tabs.
    - Close All Tabs: Closes all tabs.
    - Close Individual Tabs: Use the close button next to each listed tab to close them one by one.

# Development
To contribute or modify the extension, follow these steps:

1. Make changes to the source code in the respective files.
2. After modifying, reload the extension from the Extensions page in Chrome (chrome://extensions/) by clicking the refresh icon on the Tab Manager card.

## Files Overview
- manifest.json: The configuration file for the extension, including permissions and scripts.
- popup.html: The HTML structure for the popup interface.
- popup.js: JavaScript logic that powers the tab management functions.
- libs/sortable.min.js: A library, lightweight JavaScript library that provides drag-and-drop      sorting functionality. 