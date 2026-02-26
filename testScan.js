import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i)
            console.log(`${i}: ${msg.args()[i]}`);
        console.log(`PAGE LOG: ${msg.text()}`);
    });

    await page.goto('http://localhost:3002/scanTest.html');
    await new Promise(r => setTimeout(r, 4000));
    await browser.close();
})();
