// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));


//import models
import League from "App/Models/League";
import GameOdd from "App/Models/GameOdd";
import OddsCompare from "App/Models/OddsCompare";


export default class SportyTradersController {

    async odds({ response }) {
        const Odds = await GameOdd.all()
        console.log("Retrieving the odds ")
        return response.status(200).json(Odds);
    }

    async leagues({ response }) {
        try {
            // Launch a headless browser
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.setViewport({ width: 1366, height: 768 })

            // Navigate to the URL of the page you want to scrape
            const url = 'https://www.sportytrader.com/en/odds/football/';
            await page.goto(url);

            // Extract competition data
            const leagues = await page.evaluate(() => {
                const competitions = [];
                const competitionElements = document.querySelectorAll('.px-box .competitions a');

                competitionElements.forEach((element) => {
                    const name = element.querySelector('.text-primary-blue').textContent.trim();
                    const imageSrc = element.querySelector('img').getAttribute('src');
                    //https://www.sportytrader.com/en/odds/football/england/premier-league-49/
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
                // Check if the event already exists in the database
                const existingEvent = await League.findBy('league', league.name);
                const lg = new League();

                if (!existingEvent) {
                    lg.league = league.name;
                    lg.logo = league.imageSrc;
                    lg.link = league.href
                    await lg.save();

                    savedEvents.push(lg);
                }
            }

            // Close the Puppeteer browser
            await browser.close();

            return response.status(200).json(savedEvents);

        } catch (error) {
            console.error('Error:', error);
            return response.status(500).json({ error: 'An error occurred while scraping data.' });
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // scrape the game odds
    async gameOdds({ response, request }, link) {


        const scrapedData = [] as any;

        const browser = await puppeteer.launch();


        const links = await League.query().where('scraped', false);

        for (const link of links) {

            const page = await browser.newPage();


            const url = link.link

            await page.goto(url, {
                waitUntil: 'domcontentloaded'
            });

            await page.waitForSelector('#cal-section')
            // Extract the data from the HTML structure
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
                //#cal-section > div.px-box.mb-10 > div:nth-child(1) > div > a > span.rounded-l-md.px-1\.5.bg-gray-100.h-booklogosm.leading-8.font-medium
                await page.waitForSelector('.rounded-l-md')
                const bookmakers = await match.$$('.clickandstop');
                const OddsProviders = [];

                for (const bookmaker of bookmakers) {

                    const bookmakerName = await bookmaker.$eval('.booklogo', (img) => img.getAttribute('alt'));
                    const bookmakerOdds = await bookmaker.$eval('.px-1', (span) => span.textContent.trim());
                    const bookmakerLogo = await bookmaker.$$eval('img', (images) => images.map((img) => img.getAttribute('src')));
                    //  const bookmakerLink = await bookmaker.$eval('a', (a) => a.getAttribute('href'));
                    //  link: bookmakerLink 
                    // Click on the bookmaker to navigate to their page
                    const bookmakerLink = await page.evaluate(bookmaker => bookmaker.querySelector('.booklogo').parentElement.href, bookmaker);

                    OddsProviders.push({
                        name: bookmakerName,
                        odds: bookmakerOdds,
                        logo: bookmakerLogo,
                        Link: bookmakerLink,
                    });
                }

                // const savedEvents = [];

                const gameOdd = new GameOdd();
                gameOdd.matchday = matchday;
                gameOdd.match = game;
                gameOdd.matchodds = JSON.stringify(odds); // Convert odds to a JSON string
                gameOdd.oddsvender = JSON.stringify(OddsProviders);// Convert OddsProviders to a JSON string

                gameOdd.league_id = link.id;
                await gameOdd.save();

                // savedEvents.push(gameOdd)


                allData.push({
                    game,
                    matchday,
                    odds,
                    OddsProviders,
                });
            }

            link.scraped = true
            await link.save()

            scrapedData.push({ url, allData })




            await browser.close();

        }

        return response.status(200).json(scrapedData);

        // Handle the error, e.g., retry or mark the link as problematic


    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

    async oddsComparison({ response, request }) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the page containing the match data
        await page.goto('https://www.sportytrader.com/en/odds/liverpool-everton-6341495/');

        await page.waitForSelector('.px-box');

        // Extract the data from the HTML structure
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

                // Here, we need to capture each vendor along with their odds.
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

            const compareodd = new OddsCompare();
            compareodd.matchday = dateAndTime;
            compareodd.league = tournament;
            compareodd.game = JSON.stringify(teamNames); // Convert odds to a JSON string
            compareodd.logos = JSON.stringify(teamImages); // Convert OddsProviders to a JSON string
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
                    const bookmakerLink = await page.evaluate(
                        (bookmaker) => bookmaker.querySelector('.booklogo').parentElement.href,
                        bookmaker
                    );


                    OddsProviders.push({
                        name: bookmakerName,
                        odds: bookmakerOdds,
                        logo: bookmakerLogo,
                        Link: bookmakerLink,
                    });
                }

                const gameOdd = new GameOdd();
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
        } catch (error) {
            console.error('Error:', error);
            return { error: 'An error occurred while scraping data.' };
        }
    }
    // Define a function to scrape game odds using a cluster
    // Define a function to scrape game odds using a cluster
    async scrapeGameOddsUsingCluster({ response }) {
        try {
            const scrapedData = [];

            // Create a cluster to parallelize scraping
            const cluster = await Cluster.launch({
                concurrency: 4, // Adjust the number of concurrent pages as needed
            });

            // Fetch all the links that meet your criteria
            const links = await League.query().where('scraped', false);

            // Queue the links for scraping
            links.forEach(link => {
                cluster.queue(async ({ page, data }) => {

                    const result = await SportyTradersController.scrapeGameOddsForLink(data);
                    scrapedData.push(result);
                }, link);
            });

            // Wait for all tasks to complete
            await cluster.idle();
            await cluster.close();

            return scrapedData;
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    async scrapeGameOddsUsingLoop({ response }) {
        try {
            const scrapedData = [];

            const links = await League.query().where('scraped', false);

            // Adjust the concurrency level as needed
            const concurrency = 4;

            const scrapePromises = [];

            for (const link of links) {
                scrapePromises.push(SportyTradersController.scrapeGameOddsForLink(link));
            }

            const results = await Promise.all(scrapePromises);

            scrapedData.push(...results);

            return scrapedData;
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }




    // Define a function to fetch and scrape game odds
    async fetchAndScrapeGameOdds({ response }) {
        try {
            const scrapedData = await this.scrapeGameOddsUsingLoop({ response });

            // Respond with the scraped data
            return response.status(200).json(scrapedData);
        } catch (error) {
            // Handle any errors
            console.error(error);
            return response.status(500).json(error);
        }
    }



}
