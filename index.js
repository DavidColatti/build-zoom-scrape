const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const { convertArrayToCSV } = require("convert-array-to-csv");

const scrapeDataFromLink = async (link) => {
  const res = await axios.get(link);

  const $ = await cheerio.load(res.data);

  const business_name = $('h1[itemprop="name"]').text().trim();
  const phone_number = $(".phone .u-unclickable").text();
  const address = $("[contractor-address]").text();

  const data = {
    business_name,
    phone_number,
    address,
    link,
  };

  console.log(`Successfully scraped data: ${business_name}`);
  return data;
};

const getLinksFromPage = async (html) => {
  const $ = await cheerio.load(html);
  const links = [];

  const nodes = $(".contractor-name-link");

  nodes.each(function () {
    const linkPath = $(this).attr("href");
    const fullLink = `https://www.buildzoom.com/${linkPath}`;

    links.push(fullLink);
  });

  return links;
};

const main = async (keyword, numberOfPagesToScrape) => {
  const results = [];
  const allLinks = [];

  for (let i = 0; i < numberOfPagesToScrape; i++) {
    try {
      const res = await axios.get(
        `https://www.buildzoom.com/contractors/${keyword}?page=${i}`
      );

      const links = await getLinksFromPage(res.data);
      allLinks.push(...links);

      console.log(`${i}: Total Links Found: ${allLinks.length}`);
    } catch (e) {
      console.log(`Trouble extracting links from page ${i}`);
    }
  }

  const uniqueLinks = [...new Set(allLinks)];
  console.log(`Total unique links: ${uniqueLinks.length}`);

  for (link of uniqueLinks) {
    try {
      const data = await scrapeDataFromLink(link);

      results.push(data);

      const csv = await convertArrayToCSV(results);

      fs.writeFile("./data.csv", csv, () => {});
    } catch (e) {
      console.log(`Trouble scraping ${link}`);
    }
  }
};

main("handymen", 1);
