const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.click("text=Nouvelle consultation");
  await page.waitForTimeout(300);
  await page.click("text=Analyser la consultation");
  await page.waitForSelector("text=Génération en cours", { state: "detached", timeout: 20000 });
  await page.waitForTimeout(400);
  await page.locator("input[aria-label='Fait']").nth(3).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-jerome-Desktop-notetaking/c6b6e9ac-74fa-4473-9e6d-88689ca31043/scratchpad/right-pane2.png", clip: { x: 720, y: 130, width: 720, height: 400 } });
  console.log("DONE");
  await browser.close();
})();
