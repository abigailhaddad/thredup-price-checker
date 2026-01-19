# ThredUp Price Checker Browser Extension

Automatically check if ThredUp products are available at 50% off through their Google Ads campaign.

## How It Works

ThredUp runs Google Shopping ad campaigns where certain items are available at 50% off. The discount is applied via special "featured" URLs. You don't need to click the actual ad to get the discount - if you know the product ID, you can construct the featured URL yourself.

**The problem**: There's no way to tell from a regular product page whether that item is part of the 50% off campaign.

**The solution**: This extension automatically:
1. Takes you to the "featured" URL version of any product you view
2. Shows you a confirmation badge in the corner (green if 50% off is available, red if not)

If the item is part of the campaign, you'll see ThredUp's 50% OFF badge on the page itself. The extension's badge just gives you a quick visual confirmation so you don't have to hunt for it.

## Installation

### Chrome (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the `src` folder from this project
6. The extension is now installed and active

### Firefox (Temporary Installation)

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `src` folder and select `manifest.json`
5. The extension is now installed (note: it will be removed when Firefox restarts)

## Usage

1. Navigate to any ThredUp product page
2. The extension will automatically redirect you to the featured URL
3. A badge will appear in the top-right corner:
   - **Green "50% OFF AVAILABLE"**: The product has the 50% discount
   - **Red "NO DISCOUNT"**: No 50% discount available for this product

## Features

- Automatic redirect to featured URLs
- Visual badge showing discount status (green = yes, red = no)
- Works with women's and kids' products
- No tracking or data collection
- Lightweight - vanilla JavaScript, no dependencies

## Limitations

- Not all products have 50% off pricing (only items in ThredUp's ad campaigns)
- ThredUp limits one featured item per cart
- Featured prices and availability may change
- Extension only works on thredup.com
- Designed for logged-in users

## Privacy

This extension:
- Does NOT collect any user data
- Does NOT track your browsing behavior
- Does NOT send data to external servers
- Only communicates with thredup.com

## Project Structure
```
src/
├── manifest.json    # Extension configuration
├── content.js       # Main logic and discount detection
├── styles.css       # Badge styling
└── icons/           # Extension icons (placeholder)
```

## License

MIT License - feel free to use and modify as needed.

## Disclaimer

**Use at your own risk.** This is a personal side project - I'm not a frontend developer.

This extension is not affiliated with or endorsed by ThredUp. It relies on ThredUp's current Google Ads campaign URL structure, which could change at any time without notice and break this extension. There's no guarantee it will keep working.
