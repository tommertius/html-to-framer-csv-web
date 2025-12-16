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
  
  // Find first element with actual content
  for (let i = 0; i < sourcesElements.length; i++) {
    const elem = sourcesElements[i];
    if (elem.textContent.trim().length > 10) {
      console.log(`Element ${i}:`);
      console.log('Tag:', elem.tagName);
      console.log('Text:', elem.textContent.substring(0, 150));
      console.log('HTML:', elem.outerHTML.substring(0, 400));
      const links = elem.querySelectorAll('a');
      console.log('Links:', links.length);
      if (links.length > 0) {
        console.log('First link:', links[0].outerHTML.substring(0, 200));
      }
      break;
    }
  }
}
