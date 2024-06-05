"use strict";
function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            resolve(event.target.result);
        };

        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}

const V86_ROOT = "./libs/v86-latest";

var emulator;

var data = "";
document.getElementById('start').addEventListener('click', async function()
{
    /*var emulator = new V86({
    	screen_container: document.getElementById("screen_container"),
    	wasm_path: "./libs/v86.wasm",
        bios: { url: `${V86_ROOT}/bios/seabios.bin` },
        vga_bios: { url: `${V86_ROOT}/bios/vgabios.bin` },
        autostart: true,
        memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        bzimage_initrd_from_filesystem: true,
        filesystem: {
            basefs: {
                url: `${V86_ROOT}/images/debian-base-fs.json`,
            },
            baseurl: `${V86_ROOT}/images/debian-9p-rootfs-flat/`,
        },
        autostart: true,
    });*/
    
    emulator = new V86({
	    wasm_path: `./libs/v86.wasm`,
	    memory_size: 512 * 1024 * 1024,
	    vga_memory_size: 8 * 1024 * 1024,
	    screen_container: document.getElementById("screen_container"),
	    initial_state: { url: `./libs/blastImage.bin` },
	    filesystem: { baseurl: `./libs/debian-9p-rootfs-flat/` },
	    autostart: true
	});
    emulator.add_listener("serial0-output-byte", function(byte)
    {
        var char = String.fromCharCode(byte);
        if(char === "\r")
        {
          return;
        }

        data += char;

        if(data.endsWith(":~#"))
        {
            console.log("hi");
        }
    });
    emulator.run();

    //write file
    const submit = document.getElementById('submit');
    submit.addEventListener('click', async (event)=>{
        const fileUpload = document.getElementById('fileUpload');
        const file = fileUpload.files[0];
        console.log("Uploading: " + file.name);
        const content = await readFileAsync(file);
        const uint8ArrayContent = new Uint8Array(content);
        await emulator.create_file("/root/"+file.name, uint8ArrayContent);
        console.log("Finished Uploading")
    });

    const download = document.getElementById('download');
   	download.addEventListener('click', async (event)=>{
   		const name = document.getElementById('fileName').value;
   		

   		const file = await emulator.read_file("root/" + name);
   		// Create a Blob from the file content
	    const blob = new Blob([file], { type: 'application/octet-stream' });
	    
	    // Create a temporary URL for the Blob
	    const url = URL.createObjectURL(blob);
	    
	    // Create a link element
	    const link = document.createElement('a');
	    link.href = url;
	    link.download = name; // Set the file name for download
	    
	    // Simulate clicking the link to trigger download
	    link.click();
	    
	    // Clean up by revoking the temporary URL
	    URL.revokeObjectURL(url);
    });

    const downloadDisk = document.getElementById('downloadDisk');
    downloadDisk.addEventListener('click', async(event)=>{
        setTimeout(async function ()
            {
                const s = await emulator.save_state();
		   		/*const file = await emulator.read_file("root//" + name);
		   		// Create a Blob from the file content
			    const blob = new Blob([file], { type: 'application/octet-stream' });*/
			    const blob = new Blob([s], { type: 'application/octet-stream' });
			    // Create a temporary URL for the Blob
			    const url = URL.createObjectURL(blob);
			    
			    // Create a link element
			    const link = document.createElement('a');
			    link.href = url;
			    link.download = "DiskImage.bin"; // Set the file name for download
			    
			    // Simulate clicking the link to trigger download
			    link.click();
			    
			    // Clean up by revoking the temporary URL
			    URL.revokeObjectURL(url);
            }, 10 * 1000);
    });

    document.getElementById("restore_file").onchange = function()
    {
        if(this.files.length)
        {
            var filereader = new FileReader();
            emulator.stop();

            filereader.onload = async function(e)
            {
                await emulator.restore_state(e.target.result);
                emulator.run();
            };

            filereader.readAsArrayBuffer(this.files[0]);

            this.value = "";
        }

        this.blur();
    };
});