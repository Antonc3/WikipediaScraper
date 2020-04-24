const fs = require('fs');




process.argv.forEach((arg,i) => console.log(i,arg));
const src = process.argv[2];
const dst = process.argv[3];
const pyramind = process.argv[4];

const line_skip = process.argv[5] || 1000;
const fd = fs.openSync(src);
const fd_dst = fs.openSync(dst,'w');
console.log(fd);


let position = 0;
for(line_number = 0;; line_number++) {
	let buffer = Buffer.alloc(10000);
	let tmp_position = position;
	let bytes_read = fs.readSync(fd, buffer, 0, buffer.length, tmp_position);
	if (bytes_read == 0) break;
	let nl = buffer.indexOf('\n');
	if(nl == -1) nl = bytes_read;
	// console.log(line_number,position,nl,position+nl+1,buffer.subarray(0,nl).toString());
	if(line_number%line_skip == 0){
		let first_space = buffer.indexOf(" ");
		let to_write = [buffer.subarray(0,first_space), position].join(" ") + "\n";
		//let to_write = buffer.subarray(0,first_space) +" " +position;
		fs.writeSync(fd_dst,to_write);
	}
	position += nl+1;
}
fs.appendFile(pyramind,'\n' + dst, (err) => {
	if(err) throw err;
});
