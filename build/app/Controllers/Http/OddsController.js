"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
const League_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/League"));
const GameOdd_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/GameOdd"));
const OddsCompare_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/OddsCompare"));
class OddsController {
    async odds({ response }) {
        const Odds = await GameOdd_1.default.all();
        console.log("Retrieving the odds ");
        return response.status(200).json(Odds);
    }
    async leagues({ response }) {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({ width: 1366, height: 768 });
            const url = 'https://www.sportytrader.com/en/odds/football/';
            await page.goto(url);
            const leagues = await page.evaluate(() => {
                const competitions = [];
                const competitionElements = document.querySelectorAll('.px-box .competitions a');
                competitionElements.forEach((element) => {
                    const name = element.querySelector('.text-primary-blue').textContent.trim();
                    const imageSrc = element.querySelector('img').getAttribute('src');
                    let href = element.getAttribute('href');
                    if (href && !href.startsWith('http')) {
                        href = 'https://www.sportytrader.com' + href;
                    }
                    competitions.push({ name, imageSrc, href });
                });
                return competitions;
            });
            const savedEvents = [];
            for (const league of leagues) {
                const existingEvent = await League_1.default.findBy('league', league.name);
                const lg = new League_1.default();
                if (!existingEvent) {
                    lg.league = league.name;
                    lg.logo = league.imageSrc;
                    lg.link = league.href;
                    await lg.save();
                    savedEvents.push(lg);
                }
            }
            await browser.close();
            return response.status(200).json(savedEvents);
        }
        catch (error) {
            console.error('Error:', error);
            return response.status(500).json({ error: 'An error occurred while scraping data.' });
        }
    }
    async gameOdds({ response, request }, link) {
        const scrapedData = [];
        const browser = await puppeteer.launch();
        const links = await League_1.default.query().where('scraped', false);
        for (const link of links) {
            const page = await browser.newPage();
            const url = link.link;
            await page.goto(url, {
                waitUntil: 'domcontentloaded'
            });
            await page.waitForSelector('#cal-section');
            const matches = await page.$$('#cal-section > div.px-box.mb-10 > div');
            const allData = [];
            for (const match of matches) {
                const matchday = await match.$eval('.text-sm', (span) => span.textContent.trim());
                const game = await match.$eval('.font-medium', (a) => a.textContent.trim());
                const oddsElements = await match.$$('.px-1');
                const odds = {
                    '1': await oddsElements[0].evaluate((span) => span.textContent.trim()),
                    'X': await oddsElements[1].evaluate((span) => span.textContent.trim()),
                    '2': await oddsElements[2].evaluate((span) => span.textContent.trim()),
                };
                await page.waitForSelector('.rounded-l-md');
                const bookmakers = await match.$$('.clickandstop');
                const OddsProviders = [];
                for (const bookmaker of bookmakers) {
                    const bookmakerName = await bookmaker.$eval('.booklogo', (img) => img.getAttribute('alt'));
                    const bookmakerOdds = await bookmaker.$eval('.px-1', (span) => span.textContent.trim());
                    const bookmakerLogo = await bookmaker.$$eval('img', (images) => images.map((img) => img.getAttribute('src')));
                    const bookmakerLink = await page.evaluate(bookmaker => bookmaker.querySelector('.booklogo').parentElement.href, bookmaker);
                    OddsProviders.push({
                        name: bookmakerName,
                        odds: bookmakerOdds,
                        logo: bookmakerLogo,
                        Link: bookmakerLink,
                    });
                }
                const gameOdd = new GameOdd_1.default();
                gameOdd.matchday = matchday;
                gameOdd.match = game;
                gameOdd.matchodds = JSON.stringify(odds);
                gameOdd.oddsvender = JSON.stringify(OddsProviders);
                gameOdd.league_id = link.id;
                await gameOdd.save();
                allData.push({
                    game,
                    matchday,
                    odds,
                    OddsProviders,
                });
            }
            link.scraped = true;
            await link.save();
            scrapedData.push({ url, allData });
            await browser.close();
        }
        return response.status(200).json(scrapedData);
    }
    async oddsComparison({ response, request }) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.sportytrader.com/en/odds/liverpool-everton-6341495/');
        await page.waitForSelector('.px-box');
        const matches = await page.$$('.main__header');
        const allData = [];
        for (const match of matches) {
            const dateAndTime = await match.$eval(' div.flex.justify-center > p', (p) => p.textContent.trim());
            const tournament = await match.$eval('p.text-center.text-base-black.font-semibold', (p) => p.textContent.trim());
            const teamImages = await match.$$eval('img', (images) => images.map((img) => img.getAttribute('src')));
            const teamNames = await match.$$eval('img', (images) => images.map((img) => img.getAttribute('alt')));
            const team1Logo = teamImages[0];
            const team2Logo = teamImages[1];
            const team1Name = teamNames[0];
            const team2Name = teamNames[1];
            const comparisonOdds = await page.$$('div.a-grid > section:nth-child(4)');
            const oddsComparison = [];
            for (const odds of comparisonOdds) {
                const oddsElements = await odds.$$('.pastille--cotes');
                const Odds = {
                    '1': await oddsElements[0].evaluate((span) => span.textContent.trim()),
                    'X': await oddsElements[1].evaluate((span) => span.textContent.trim()),
                    '2': await oddsElements[2].evaluate((span) => span.textContent.trim()),
                };
                const vendorImages = await odds.$$eval('img', (images) => images.map((img) => img.getAttribute('src')));
                const vendorNames = await odds.$$eval('img', (images) => images.map((img) => img.getAttribute('alt')));
                const vendors = [];
                for (let i = 0; i < vendorNames.length; i++) {
                    vendors.push({
                        name: vendorNames[i],
                        odds: Odds,
                        logo: vendorImages[i]
                    });
                }
                oddsComparison.push({
                    vendors,
                });
            }
            const compareodd = new OddsCompare_1.default();
            compareodd.matchday = dateAndTime;
            compareodd.league = tournament;
            compareodd.game = JSON.stringify(teamNames);
            compareodd.logos = JSON.stringify(teamImages);
            compareodd.oddscompare = JSON.stringify(oddsComparison);
            await compareodd.save();
            allData.push({
                date_time: dateAndTime,
                league: tournament,
                team1: {
                    name: team1Name,
                    logo: team1Logo,
                },
                team2: {
                    name: team2Name,
                    logo: team2Logo,
                },
                oddsComparison,
            });
        }
        await browser.close();
        return response.status(200).json(allData);
    }
    static async scrapeGameOddsForLink(link) {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            const url = link.link;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('#cal-section');
            const matches = await page.$$('#cal-section > div.px-box.mb-10 > div');
            const allData = [];
            for (const match of matches) {
                const matchday = await match.$eval('.text-sm', (span) => span.textContent.trim());
                const game = await match.$eval('.font-medium', (a) => a.textContent.trim());
                const oddsElements = await match.$$('.px-1');
                const odds = {
                    '1': await oddsElements[0].evaluate((span) => span.textContent.trim()),
                    'X': await oddsElements[1].evaluate((span) => span.textContent.trim()),
                    '2': await oddsElements[2].evaluate((span) => span.textContent.trim()),
                };
                await page.waitForSelector('.rounded-l-md');
                const bookmakers = await match.$$('.clickandstop');
                const OddsProviders = [];
                for (const bookmaker of bookmakers) {
                    const bookmakerName = await bookmaker.$eval('.booklogo', (img) => img.getAttribute('alt'));
                    const bookmakerOdds = await bookmaker.$eval('.px-1', (span) => span.textContent.trim());
                    const bookmakerLogo = await bookmaker.$$eval('img', (images) => images.map((img) => img.getAttribute('src')));
                    const bookmakerLink = await page.evaluate((bookmaker) => bookmaker.querySelector('.booklogo').parentElement.href, bookmaker);
                    OddsProviders.push({
                        name: bookmakerName,
                        odds: bookmakerOdds,
                        logo: bookmakerLogo,
                        Link: bookmakerLink,
                    });
                }
                const gameOdd = new GameOdd_1.default();
                gameOdd.matchday = matchday;
                gameOdd.match = game;
                gameOdd.matchodds = JSON.stringify(odds);
                gameOdd.oddsvender = JSON.stringify(OddsProviders);
                gameOdd.league_id = link.id;
                await gameOdd.save();
                allData.push({
                    game,
                    matchday,
                    odds,
                    OddsProviders,
                });
            }
            link.scraped = true;
            await link.save();
            await browser.close();
            return { url, allData };
        }
        catch (error) {
            console.error('Error:', error);
            return { error: 'An error occurred while scraping data.' };
        }
    }
    async scrapeGameOddsUsingCluster({ response }) {
        try {
            const scrapedData = [];
            const cluster = await Cluster.launch({
                concurrency: 4,
            });
            const links = await League_1.default.query().where('scraped', false);
            links.forEach(link => {
                cluster.queue(async ({ page, data }) => {
                    const result = await SportyTradersController.scrapeGameOddsForLink(data);
                    scrapedData.push(result);
                }, link);
            });
            await cluster.idle();
            await cluster.close();
            return scrapedData;
        }
        catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }
    async scrapeGameOddsUsingLoop({ response }) {
        try {
            const scrapedData = [];
            const links = await League_1.default.query().where('scraped', false);
            const concurrency = 4;
            const scrapePromises = [];
            for (const link of links) {
                scrapePromises.push(SportyTradersController.scrapeGameOddsForLink(link));
            }
            const results = await Promise.all(scrapePromises);
            scrapedData.push(...results);
            return scrapedData;
        }
        catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }
    async fetchAndScrapeGameOdds({ response }) {
        try {
            const scrapedData = await this.scrapeGameOddsUsingLoop({ response });
            return response.status(200).json(scrapedData);
        }
        catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }
}
exports.default = OddsController;
//# sourceMappingURL=OddsController.js.map