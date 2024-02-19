/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'
//Route.get('/', async () => {
// return { hello: 'world' }
//})

//Route.get('leagues ', 'OddsController.leagues');

Route.get('/_leagues', 'OddsController.leagues');

Route.get('/_leagues/gameodds', 'OddsController.fetchAndScrapeGameOdds')
//.middleware('throttle:global');

Route.get('/_leagues/gameodds/compare_odds', 'OddsController.oddsComparison');

Route.get('/gameodds', 'OddsController.odds');
