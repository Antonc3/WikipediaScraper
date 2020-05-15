set -x
node wikipedia.js settings.txt
LC_ALL=C sort Wikisort.txt > sorted_data.txt
node compress.js sorted_data.txt pages/page0.txt settings.txt
node skipline.js pages/page0.txt pages/page1.txt settings.txt
node skipline.js pages/page1.txt pages/page2.txt settings.txt
node skipline.js pages/page2.txt pages/page3.txt settings.txt
node skipline.js pages/page3.txt pages/page4.txt settings.txt
node skipline.js pages/page4.txt pages/page5.txt settings.txt
node skipline.js pages/page5.txt pages/page6.txt settings.txt
node skipline.js pages/page6.txt pages/page7.txt settings.txt
node skipline.js pages/page7.txt pages/page8.txt settings.txt
node skipline.js pages/page8.txt pages/page9.txt settings.txt