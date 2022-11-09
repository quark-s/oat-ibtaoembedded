const fs = require("fs");
const AdmZip = require("adm-zip");
const path = require("path");
// const replace = require("replace-in-file");
const URL = require("url").URL;

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { Item } = require("./lib/Item");

const argv = yargs(hideBin(process.argv))
  .alias("i", "item")
  .nargs("i", 1)
  .describe("i", "folder containering at least one item to read information from (optional)")
  .alias("o", "output")
  .nargs("o", 1)
  .describe("o", "Output directory (default: current directory)").argv;

let item = null;
let confFile = "../../views/js/pciCreator/ibTaoEmbedded/confDefault.json";
let conf = JSON.parse(fs.readFileSync(confFile));

//Mediafiles
    let pciCreatorFile = "../../views/js/pciCreator/ibTaoEmbedded/pciCreator.json";
    let pciCreator = JSON.parse(fs.readFileSync(pciCreatorFile));
    let basepath = "../../views/js/pciCreator/ibTaoEmbedded/runtime/assets/ee";
    let relativeRoot = "../../views/js/pciCreator/ibTaoEmbedded/";

    function getFileList(_path, _relativeRoot){
        let tmp = [];
        fs.readdirSync(_path, ).forEach(f => {
            let stats = fs.lstatSync(path.join(_path, f));
            if(stats.isDirectory())
                tmp = tmp.concat(getFileList(path.join(_path, f), _relativeRoot));
            else{
                let _rPath = _path.replace(_relativeRoot, '');
                tmp.push("./"+path.join(_rPath, f));
            }
        });
        return tmp;
    }

    let files = getFileList(basepath, relativeRoot);
    pciCreator["runtime"]["mediaFiles"] = files;
    fs.writeFileSync(pciCreatorFile, JSON.stringify(pciCreator));
    
    

if (!fs.existsSync(argv.i)) {
    console.error("Folder not readable: " + argv.i);
}
else{
    let items = fs.readdirSync(argv.i).filter(i => i.indexOf(".zip")>=0);
    if(items.length==0){
        console.error("Folder does not contain a valid zip file: " + argv.i);
    }
    else {
        try {
            item = new Item(new AdmZip(path.join(argv.i, items[0])));
        } catch (e) {
            console.error(e.message);
        }
    }
}

if (!!item) {

    try {
        let _item = item.getTaoConfig()
        conf.iwidth = _item.tasks[0].width;
        conf.iheight = _item.tasks[0].height;
    } catch (error) {
        console.error("Error occurred:", error);
    }
}

fs.writeFileSync(confFile, JSON.stringify(conf));

let pciZip = new AdmZip();
pciZip.addLocalFolder(path.join(__dirname, "../../views/js/pciCreator/ibTaoEmbedded"));

let outpath = fs.existsSync(argv.o) ? argv.o : "./";
let zipfile = path.join(outpath, "ibTaoEmbedded.zip");
console.log("creating "+zipfile)
pciZip.writeZip(zipfile);

process.exit();

