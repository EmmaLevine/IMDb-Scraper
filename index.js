const axios = require("axios");
const cheerio = require("cheerio");
const async = require('async');
const await = require('await');
const fs = require('fs');
const readline = require('readline');

const domainToScrape = 'https://www.imdb.com';
const fetchMovies = async (searchTerm) => {
    try {
        searchTerm = searchTerm.trim().toLowerCase();
        console.log('Searching IMDB for ' + searchTerm);
        const response = await axios.get(domainToScrape + '/find?s=tt&ttype=ft&q=' + searchTerm);
        const html = response.data;
        const $ = cheerio.load(html);
        var movies = [];
        $('.result_text > a').each((_idx, el) => {
            var $link = $(el);
            if ($link.parent().text().indexOf('(in development') == -1
                && $link.text().toLowerCase().indexOf(searchTerm) > -1) {
                movies.push($link.prop('href'));
            }  
        });
        console.log(movies.length + ' movies found.');
        return movies;
    } catch (error) {
        console.log(error);
    }
};

const fetchDetails = async (url) => {
    try {
        const response = await axios.get(domainToScrape + url);
        const html = response.data;
        const $ = cheerio.load(html);
        var details = [];
        details.push($('h1').text().trim());//title
        var genres = [];
        $('[data-testid=genres] a').each(function (_idx, el) {
            genres.push($(el).text().trim());
        });
        details.push(genres.join(','));//genres

        var $heroTitle = $('ul[data-testid=hero-title-block__metadata]');
        details.push($heroTitle.find('li:nth-child(2) > a').text().trim());//rating
        details.push($heroTitle.find('li:last-child').text().trim());//duration

        var directors = [];
        var $directorLabel = $('span:contains(Director)');
        if ($directorLabel.length) {
            var $directorList = $($directorLabel[0]).next().find('li > a').each(function (_idx, el) {
                directors.push($(el).text().trim());
            });
        }
        details.push(directors.join(','));//directors

        var actors = [];
        $('[data-testid=title-cast-item__actor]').each(function (_idx, el) {
            actors.push($(el).text().trim());
        });
        details.push(actors.join(','));//actors
        return details;
    } catch (error) {
        console.log(error);
    }
};

const saveResults = (rows) => {
    const filename = 'scrape_results.txt';
    console.log('saving results to ' + filename);
    var output = rows.join('\n');
    fs.writeFile(filename, output, function (err) {
        if (err) return console.log(err);
    });
    console.log('Done!');
    const readline = require('readline');
};

const runScraper = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(`Please enter the movie name (for example: Star Trek)`, (searchTerm) => {
        rl.close();
        fetchMovies(searchTerm).then((movies) => {
            var movieCount = movies.length;
            var rows = [];
            console.log('Scraping details...');
            movies.forEach(url => {
                fetchDetails(url).then((details) => {
                    var row = details.join('|');
                    rows.push(row);
                    var currentProcessingRow = rows.length;
                    console.log('Scraped movie ' + currentProcessingRow + '/' + movieCount);
                    if (rows.length == movieCount) {
                        saveResults(rows);
                    }
                });
            });
        });
    });
}
runScraper();
