"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
Route_1.default.get('/_leagues', 'OddsController.leagues');
Route_1.default.get('/_leagues/gameodds', 'OddsController.fetchAndScrapeGameOdds');
Route_1.default.get('/_leagues/gameodds/compare_odds', 'OddsController.oddsComparison');
Route_1.default.get('/gameodds', 'OddsController.odds');
Route_1.default.get('/compare_gameodds', 'OddsController.compareodds');
//# sourceMappingURL=routes.js.map