const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const transcript = fs.readFileSync("/Users/jerome/Desktop/notetaking/data/adverserial.txt", "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.click("text=Nouvelle consultation");
  await page.waitForTimeout(300);

  // Test 1: simulate_wrong_action console command
  await page.evaluate(() => window.simulate_wrong_action());
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-jerome-Desktop-notetaking/c6b6e9ac-74fa-4473-9e6d-88689ca31043/scratchpad/sim-wrong-action.png", clip: { x: 0, y: 60, width: 900, height: 200 } });

  await page.click("text=Compléments");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-jerome-Desktop-notetaking/c6b6e9ac-74fa-4473-9e6d-88689ca31043/scratchpad/sim-wrong-action-complements.png", fullPage: true });

  console.log("DONE");
  await browser.close();
})();
