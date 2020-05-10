/*
Pull One Page
Pull and parse
pull more?
Put depth, not too deep
File, append to it
Offset - how far into file, file io

split it into words
create a class 
assign doc # to each doc
word then docid

have a doc with docid then url 

after sort files,
one line per word per document

phonebook
scan through

intersect list
 
*/

const fs = require("fs");
const rp = require("request-promise");
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

let seen = new Map();
let operations = 0;
let op_max = 1000000;


let file_num_cnt = 100000;
let file_num_start = 100000;

let file_name_num = "index.txt";



let process_running = 0;
let process_max = 10;
class Stack {
	constructor(){
		this.items = new Array();
	}
	pop(){
		if(this.items.length == 0){
			return "no elements";
		}
		return this.items.pop();
	}
	push(element){
		this.items.push(element);
	}
	peek(){
		return this.items[this.items.length-1];
	}
	size(){
		return this.items.length;
	}
	isEmpty(){
		return this.items.length == 0;
	}
	print(){
		for(let i = this.items.length-1; i >= 0; i--){
			console.log(this.items[i]);
		}
	} 	
}

let to_be_checked = new Stack();
to_be_checked.push('https://wikipedia.org/wiki/Main_Page');
seen.set(to_be_checked.peek(),-1);
function open_source_code(url){
	rp(url)
	.then(response => {
		get_urls(response,url);
		return 1;
	}).catch((err) =>{
		// console.log("ERROR: updating search");
		console.log(err);
		// update_search();
		// console.log("Finished Seach update");
	}).finally(function(){
		update_search();
		// console.log("updated search");
	});
}

function array_equals(page,ind,str){
	let cnt = 0;
	for(let i = ind; i <ind+str.length;i++){
		if(page[i] != str[cnt]){
			return false;
		}
		cnt++;
	}
	return true;
}

function get_quotation(page,ind){
	let str = "";
	while(page[ind] != '"'){
		//console.log(str);
		str += page[ind];
		ind++;
	}
	return str;
}

function cut_excess(url){
	if(url.length > 12){
		if(url.substring(6,12) == "Portal"){
			return "";
		}
	}
	for(let i = 0; i < url.length; i++){
		if(url[i] == '(' && url[i-1] == '_'){
			return url.substring(0,i-1);
		}
		if(url[i] == '?' || url[i] == '#'){
			return url.substring(0,i);
		}
		if(url[i] == ':'){
			return "";
		}
	}
	return url;
}
function clear_collapsed(page){
	// let page0 = page.split(/<.*?>/s);
	let page0 = [];
	for(let i = 0; i < page.length;i){
		if(page[i] == '<'){
			let before = i;
			let done = false;
			for(i; i < page.length; i++){
				if(page[i] == '>') {
					page0.push(page.substring(before,++i));
					done = true;
					break;
				}
			}
			if(!done){
				page0.push(page.substring(before,++i));
			}

		}
		else{
			let done = false;
			let before = i;
			for(i; i < page.length; i++){
				if(page[i] == '<'){
					done=true;
					page0.push(page.substring(before,i));
					break;
				}
			}
			if(!done){
				page0.push(page.substring(before,i));
			}
		}
	}
	// console.log(page0);
	let start = 0;
	let cnt = 0;
	let active = false;
	for(let i = 0; i < page0.length; i++){
		// console.log(page0[i].substring(0,6));
		if(page0[i].substring(0,6) == "<table"&& page0[i].includes("mw-collapsible")&&!active){
			active = true;
			start = i;
			cnt++;
		}
		else if(page0[i].substring(0,6) == "<table"&& active){
			cnt++;
		}
		else if(page0[i].substring(0,7) == '</table' && active){
			cnt--;
		}
		if(active && cnt == 0){
			page0 = page0.slice(0,start).concat(page0.slice(i+1))
			i = start-1;
			active = false;
		}
	}
	if(active){
		page0 = page0.slice(0,start);
	}
	return page0.join('');
}
function clean_page(page,id){
	page = clear_collapsed(page);
	page = page
		.replace(/(<script>)([\s\S]*?)(<\/script>)/g," ")
		.replace(/<[^>]+>/g," ")
		// .replace(/^\s+|\s$/sg,"")
		;
	page = entities.decode(page);
	page = page
		.replace(/\W+/ug," ")
		// .substring(1,page.length-1)
		.split(/\s+/s)
		.filter(word => word)
		.map(word => `${word} ${id}\n`)
		.join('')
		;
	return page;
}

function get_urls(page,cur_url){
	//let page = open_source_code(url);
	for(let i = 0; i < page.length; i++){
		//console.log(i);
			if(array_equals(page,i,'"/wiki/')){
				i++;
				let pulled_url = get_quotation(page,i);
				//i+=pulled_url.length-1;
				let size = pulled_url.length;
				let shouldPush = false;

				pulled_url = cut_excess(pulled_url);
				let new_url = "https://wikipedia.org" + pulled_url;
				if(seen.get(new_url) != -1 && pulled_url.length >= 7){
					shouldPush = true;
				}
				//console.log(seen.get(new_url));
				if(shouldPush){
					// console.log(new_url);
					seen.set(new_url, -1);
					// console.log(seen.get(new_url));
					to_be_checked.push(new_url);
				}
		}
	}
	let id_num = file_num_cnt;
	page = clean_page(page,id_num).toLowerCase();
	fs.appendFile("Wikisort.txt",page,(err) => {
	  if (err) throw err;
	  //console.log('The "data to append" was appended to file!');
	});
	fs.appendFile(file_name_num,"" + id_num +" "+ cur_url + "\n",(err) => {
	  if (err) throw err;
	  //console.log('The "data to append" was appended to file!');
	});
	file_num_cnt++;
	operations++;
	process_running--;
	update_search();
}

function update_search(){
	while(operations < op_max && process_running < process_max && !to_be_checked.isEmpty()){
		let next_url = to_be_checked.pop();
		open_source_code(next_url);
		console.log(operations + ": processes running" + process_running + next_url + ", tbc: "+ to_be_checked.size());
		process_running++;
	}
	// console.log("No more links to be checked");
}
function test(url){
	rp(url)
	.then(response => {
		fs.appendFile("test.txt",clean_page(response),(err) => {
			if (err) throw err;
		});
	})
}
fs.writeFile("Wikisort.txt",'',function(){});
fs.writeFile(file_name_num,'',function(){});
update_search();
// test("https://en.wikipedia.org/wiki/English_Wikipedia")