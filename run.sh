set -x
node wikipedia.js
LC_ALL=C sort Wikisort.txt > sorted_data.txt
node compress.js sorted_data.txt page0.txt pyramind.txt
node readline/main.js page0.txt page1.txt pyramind.txt
node readline/main.js page1.txt page2.txt pyramind.txt
node readline/main.js page2.txt page3.txt pyramind.txt
node readline/main.js page3.txt page4.txt pyramind.txt
node readline/main.js page4.txt page5.txt pyramind.txt
node readline/main.js page5.txt page6.txt pyramind.txt
node readline/main.js page6.txt page7.txt pyramind.txt
node readline/main.js page7.txt page8.txt pyramind.txt
node readline/main.js page8.txt page9.txt pyramind.txt