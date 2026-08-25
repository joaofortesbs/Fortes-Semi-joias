import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.goto("https://3000-iidx99rxqb3of3lvcxn3i-39bdd11e.us4.manus.computer/?from_webdev=1", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const resizeErrors = errors.filter(message => message.includes("ResizeObserver loop completed with undelivered notifications"));
if (resizeErrors.length > 0) throw new Error(`ResizeObserver ainda gerou ${resizeErrors.length} erro(s) no console.`);
console.log(JSON.stringify({ pageErrors: errors, resizeObserverErrors: resizeErrors.length }));
await browser.close();
