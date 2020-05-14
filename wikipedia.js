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
let op_max = 1000;


let file_num_cnt = 100000;
let file_num_start = 100000;

let file_name_num = "index.txt";



let process_running = 0;
let process_max = 4;
let stk = "stack.txt";
let stack_fd = fs.openSync(stk);
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
function resume_search(){
	let fd  = fs.openSync(file_name_num);
	let pos = 0;
	let line;
	for(line = 0;; line++){
		let tmp_pos = pos;
		let buffer = Buffer.alloc(100000);
		let bytesRead = fs.readSync(fd,buffer,0,buffer.length,tmp_pos);
		if(bytesRead == 0){
			break;
		}
		let nl = buffer.indexOf('\n');
		if(nl == -1){
			nl = bytesRead;
		}
		let space = buffer.indexOf(' ');
		let url = buffer.subarray(space+1,nl).toString('utf8');
		console.log(url);
		seen.set(url,-1);
		pos += 1 + nl;
	}
	operations = line;
	file_num_cnt = file_num_start +line;
	pos = 0;
	for(line = 0;; line++){
		let tmp_pos = pos;
		let buffer = Buffer.alloc(100000);
		let bytesRead = fs.readSync(stack_fd,buffer,0,buffer.length,tmp_pos);
		if(bytesRead == 0){
			break;
		}
		let nl = buffer.indexOf('\n');
		let url = buffer.subarray(0,nl).toString('utf8');
		if(seen.get(url) != -1){
			to_be_checked.push(url);
		}
		pos += 1 + nl;
	}
}

function open_source_code(url){
	rp(url)
	.then(response => {
		get_urls(response,url);
		return 1;
	}).catch((err) =>{
		console.log(err);
		process_running--;
		operations--;
	}).finally(function(){
		update_search();
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

function find_orig_link(page,cur_url){
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
	for(let i = 0; i < page0.length; i++){
		if(page0[i].substring(0,27) =='<link rel="canonical" href='){
			return get_quotation(page0[i],28);
		}
	}
	return cur_url;
}
//mainly used to clear the tables at the bottom of the wikipedia page, but clears everything labelled with 'mw-collapsed'
function clear_collapsed(page){
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
	
	let start = 0;
	let cnt = 0;
	let active = false;
	for(let i = 0; i < page0.length; i++){
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
//used to clear as much excess as possible including the things in <> brackets
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
	let canonical_url = find_orig_link(page,cur_url);
	if(seen.get(canonical_url)==-1 && canonical_url != cur_url){
		process_running--;
		return;
	}
	seen.set(canonical_url,-1);
	for(let i = 0; i < page.length; i++){
			if(array_equals(page,i,'"/wiki/')){
				i++;
				let pulled_url = get_quotation(page,i);
				let size = pulled_url.length;
				pulled_url = cut_excess(pulled_url);
				let new_url = "https://wikipedia.org" + pulled_url;
				if(seen.get(new_url) != -1 && pulled_url.length >= 7){
					seen.set(new_url, -1);
					fs.appendFile(stk,new_url + '\n', (err)=>{
						if(err)throw err;
					});
					to_be_checked.push(new_url);
				}
		}
	}
	let id_num = file_num_cnt;
	page = clean_page(page,id_num).toLowerCase();
	fs.appendFile("Wikisort.txt",page,(err) => {
	  if (err) throw err;
	});
	fs.appendFile(file_name_num,"" + id_num +" "+ canonical_url + "\n",(err) => {
	  if (err) throw err;
	});
	file_num_cnt++;
	process_running--;
}
//called at the end in order to update the search and refresh it
function update_search(){
	while(operations < op_max && process_running < process_max && !to_be_checked.isEmpty()){
		let next_url = to_be_checked.pop();
		open_source_code(next_url);
		console.log(operations + " " + next_url);
		operations++;
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

function resume_and_search(){
	resume_search();
	update_search();
}

function reset_then_search(){
	fs.writeFile("Wikisort.txt",'',function(){});
	fs.writeFile(file_name_num,'',function(){});
	fs.writeFile(stk,'',function(){});
	to_be_checked.push('https://wikipedia.org/wiki/Main_Page');
	seen.set(to_be_checked.peek(),-1);
	update_search();
}

// Two different modes, one is to reset the entire search and start over while the other is to resume, keeping the data you already had and adding in new data

// resume_and_search();
reset_then_search();