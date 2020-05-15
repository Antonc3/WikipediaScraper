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

let settings = process.argv[2];
let set = fs.openSync(settings);



let seen = new Map();
let operations = 0;
let op_max;

let file_num_cnt;
let file_num_start

let index;


let process_running = 0;
let process_max;

let stk;
let stack_fd;

let pyramind;
let pyr;

let resume;

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

function read_settings(){
	let buffer = Buffer.alloc(100000);
	let bytes_read = fs.readSync(set,buffer,0,buffer.length,0);
	let space1 = buffer.indexOf(' ');
	let nl1 = buffer.indexOf('\n');
	file_num_start = parseInt(buffer.subarray(space1, nl1).toString('utf8'));
	file_num_cnt = file_num_start;

	let space2 = nl1+buffer.subarray(nl1,bytes_read).indexOf(' ');
	let nl2 = nl1+buffer.subarray(nl1+1,bytes_read).indexOf('\n')+1;
	index = buffer.subarray(space2+1,nl2).toString('utf8');

	let space3 = nl2+buffer.subarray(nl2,bytes_read).indexOf(' ');
	let nl3 = nl2+buffer.subarray(nl2+1,bytes_read).indexOf('\n')+1;
	op_max = parseInt(buffer.subarray(space3+1,nl3).toString('utf8'));

	let space4 = nl3+buffer.subarray(nl3,bytes_read).indexOf(' ');
	let nl4 = nl3 + buffer.subarray(nl3+1,bytes_read).indexOf('\n')+1;
	stk = buffer.subarray(space4+1,nl4).toString('utf8');
	stack_fd = fs.openSync(stk);

	let space5 = nl4+buffer.subarray(nl4,bytes_read).indexOf(' ');
	let nl5 = nl4 + buffer.subarray(nl4+1,bytes_read).indexOf('\n')+1;
	process_max = parseInt(buffer.subarray(space5+1,nl5).toString('utf8'));

	let space6 = nl5+buffer.subarray(nl5,bytes_read).indexOf(' ');
	let nl6 = nl5 + buffer.subarray(nl5+1,bytes_read).indexOf('\n')+1;
	pyramind = buffer.subarray(space6+1,nl6).toString('utf8');
	pyr = fs.openSync(pyramind);

	let space7 = nl6 + buffer.subarray(nl6,bytes_read).indexOf(' ');
	let nl7 = nl6 + buffer.subarray(nl6+1,bytes_read).indexOf('\n')+1;
	//line_skip = parseInt(buffer.subarray(space7+1,nl7).toString('utf8'));

	let space8 = nl7 + buffer.subarray(nl7,bytes_read).indexOf(' ');
	resume = buffer.subarray(space7+1,nl7).toString('utf8')=='true';

}
read_settings();

function resume_search(){
	let fd  = fs.openSync(index);
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
		process_running--;
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
	let init = page[ind];
	if(init != '"' && init!="'" && init!="`") return "";
	ind++;
	while(page[ind] != init || ind >= page.length){
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
			return get_quotation(page0[i].substring(27),0);
		}
	}
	return cur_url;
}

function clear_bracket(page,phrase,conditions){
	let start = 0;
	let cnt = 0;
	let active = false;
	for(let i = 0; i < page.length; i++){
		if(page[i].substring(0,phrase.length+1) == ("<" + phrase)&&!active){
			for(let j = 0; j < conditions.length;j++){
				if(page[i].includes(conditions[j]) && !active){
					active = true;
					start = i;
					cnt++;
					break;
				}
			}
		}
		else if(page[i].substring(0,phrase.length+1) == ("<" + phrase)&& active){
			cnt++;
		}
		else if(page[i].substring(0,phrase.length+2) == ("</" + phrase) && active){
			cnt--;
		}
		if(active && cnt == 0){
			page = page.slice(0,start).concat(page.slice(i+1))
			i = start-1;
			active = false;
		}
	}
	if(active){
		page = page.slice(0,start);
	}
	return page;
}

//mainly used to clear the tables at the bottom of the wikipedia page, but clears everything labelled with 'mw-collapsed'
function clear_unnecessary(page){
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
	
	page0 = clear_bracket(page0,"table",["mw-collapsible"]);
	page0 = clear_bracket(page0,"div",["reflist", 'class="noprint"',"navigation","printfooter","catlinks"]);
	page0 = clear_bracket(page0,"sup",['class="reference"']);
	page0 = clear_bracket(page0,"style",['']);
	page0 = clear_bracket(page0,"a",["mw-jump-link",'class="external text']);
	page0 = clear_bracket(page0,"span",['']);

	return page0.join('');
}
function get_body(page){
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
		if(page0[i].substring(0,4) == "<div"&& page0[i].includes('id="content"')&&!active){
			active = true;
			start = i;
			cnt++;
		}
		else if(page0[i].substring(0,4) == "<div"&& active){
			cnt++;
		}
		else if(page0[i].substring(0,5) == '</div' && active){
			cnt--;
		}
		if(active && cnt == 0){
			page0 = page0.slice(start,i+1);
			i = start-1;
			active = false;
		}
	}
	if(active){
		page0 = page0.slice(start);
	}
	return page0.join('');
}
//used to clear as much excess as possible including the things in <> brackets
function clean_page(page,id){
	page = get_body(page);
	// console.log("hel");
	page =  clear_unnecessary(page);
	page = page
		.replace(/(<script)([\s\S]*?)(<\/script>)/g," ")
		.replace(/<[^>]+>/g," ")
		;
	page = page
		.replace(/[^\.\,]+ /g, "")
		.replace(/[\d\W]+/ug," ")
		.split(/\s+/s)
		.filter(word => word)
		.map(word => `${word} ${id}\n`)
		.join('')
		;
	return page;
}

function get_urls(page,cur_url){
	let canonical_url = "https://en.wikipedia.org" + cut_excess(find_orig_link(page,cur_url).substring(24));
	if(seen.get(canonical_url)==-1 && canonical_url != cur_url){
		process_running--;
		return;
	}
	seen.set(canonical_url,-1);
	for(let i = 0; i < page.length; i++){
		if(array_equals(page,i,'"/wiki/')){
			let pulled_url = get_quotation(page,i);
			let size = pulled_url.length;
			pulled_url = cut_excess(pulled_url);
			let new_url = "https://en.wikipedia.org" + pulled_url;
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
	page = clean_page(page.toLowerCase(),id_num);
	console.log(id_num + " " + canonical_url);
	fs.appendFile("Wikisort.txt",page,(err) => {
	  if (err) throw err;
	});
	fs.appendFile(index,"" + id_num +" "+ canonical_url + "\n",(err) => {
	  if (err) throw err;
	});
	file_num_cnt++;
	process_running--;
	operations++;
}
//called at the end in order to update the search and refresh it
function update_search(){
	while(operations < op_max && process_running < process_max && !to_be_checked.isEmpty()){
		let next_url = to_be_checked.pop();
		open_source_code(next_url);
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
	fs.writeFile(pyramind,'',function(){});
	fs.writeFile("Wikisort.txt",'',function(){});
	fs.writeFile(index,'',function(){});
	fs.writeFile(stk,'',function(){});
	to_be_checked.push('https://en.wikipedia.org/wiki/Main_Page');
	seen.set(to_be_checked.peek(),-1);
	update_search();
}


function test(url){
	rp(url)
	.then(response =>{
		get_urls(response,url);
	});
}

// Two different modes, one is to reset the entire search and start over while the other is to resume, keeping the data you already had and adding in new data

if(resume){
	resume_and_search();
}
else{
	reset_then_search()
}