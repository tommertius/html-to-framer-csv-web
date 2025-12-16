import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('/home/ubuntu/upload/Article27VijfmiljardtegendeklokwaaromNederlan.html', 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

const hrs = document.querySelectorAll('hr');
if (hrs.length > 0) {
  const hr = hrs[0];
  const sourcesElements = [];
  let current = hr.nextElementSibling;
  
  while (current) {
    sourcesElements.push(current);
    current = current.nextElementSibling;
  }
  
  // Find elements with links
  for (let i = 0; i < Math.min(10, sourcesElements.length); i++) {
    const elem = sourcesElements[i];
    const links = elem.querySelectorAll('a');
    if (links.length > 0) {
      console.log(`\nElement ${i} (${elem.tagName}):`);
      console.log('Text:', elem.textContent.substring(0, 100));
      console.log('Link HTML:', links[0].outerHTML);
      break;
    }
  }
}
