# CMC Tracker

CMC Tracker is a portfolio management dashboard for tracking crypto, fiat, and gold holdings in Toman, with AI-assisted price refreshes. The app supports user logins with an admin panel for managing users, tracking transactions, and viewing performance summaries.

## Features
- User authentication with persistent storage for transactions (bcrypt hashed credentials).
- Admin panel to manage users and review portfolio activity.
- **BrsApi.ir Live Integration:** Real-time prices for 28 fiat currencies, gold, full range of gold coins (Emami, Bahar, Nim, Rob, Gerami), and 19 major cryptocurrencies.
- **24-Hour Market Change Indicators:** Real-time percentage shifts displayed on individual asset rows and top summary cards.
- **Precision Gold & Coin Bubble Calculator:** Live intrinsic value calculation based on world gold ounce (XAUUSD) and free market USD rate.
- **DCA Calculator & Portfolio Analytics:** Dollar-cost averaging simulation, realized/unrealized PnL, and allocation charts.
- **Vector Icon Assets:** High-contrast, brand-compliant SVG vector badges for gold assets, country flags for fiat, and CoinCap CDN icons for crypto.

## Prerequisites
- Node.js 20+
- npm

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set required environment variables (create a `.env` if needed):
   - `BRS_API_KEY`: API key for BrsApi.ir market rates service.
   - `VITE_GEMINI_API_KEY`: Gemini API key for AI assistant features.
   - Optional overrides: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PORT` (default `8080`).
3. Start the development server:
   ```bash
   npm run dev
   ```

## Build for Production
Generate the optimized client bundle:
```bash
npm run build
```

## Docker
Build a production image that serves the built app through the Express server:
```bash
docker build -t cmc-tracker:latest .
```

Run the container (creates a `/app/data` volume for user/price data):
```bash
docker run -p 8080:8080 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=password \
  -e PORT=8080 \
  -e BRS_API_KEY=your_brsapi_key \
  -e VITE_GEMINI_API_KEY=your_key \
  -v $(pwd)/data:/app/data \
  cmc-tracker:latest
```

You can also use `docker-compose`:
```bash
docker-compose up --build
```
The app will be available at http://localhost:8080.

## Project Scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – build the client bundle.
- `npm run preview` – preview production build locally.
- `npm start` – run the production Express server (expects `dist` to exist).
