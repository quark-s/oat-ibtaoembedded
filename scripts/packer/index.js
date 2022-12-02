const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const path = require("path");
const replace = require("replace-in-file");
const URL = require("url").URL;

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { Item } = require("./lib/Item");

const argv = yargs(hideBin(process.argv))
  .alias("i", "item")
  .nargs("i", 1)
  .describe("i", "folder containering at least one item to read information from (optional)")
  .alias("t", "pci identifier")
  .nargs("t", 1)
  .describe("t", "unique identifier to be used and replaced in the pci template code (default: random characters)")
  .alias("l", "label")
  .nargs("l", 1)
  .describe("l", "Label (default: Itembuilder Integration)")  
  .alias("o", "output")
  .nargs("o", 1)
  .describe("o", "Output directory (default: current directory)").argv;

let item = null;
let confFile = "../../views/js/pciCreator/ibTaoConnector/confDefault.json";
let conf = JSON.parse(fs.readFileSync(confFile));

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

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

//copy to tmp
    let relativeRoot = "../../views/js/pciCreator/ibTaoConnector/";

    if(fs.existsSync("./tmp"))
        fs.removeSync("./tmp");
    fs.mkdirSync("./tmp");
    fs.copySync(relativeRoot, "./tmp");


// ******** replace identifier *********

    let pciIdentifier = makeid(6);
    if(
        !!argv.t &&
        argv.t.length > 3 &&
        argv.t.length <= 16 &&
        /^([a-z]|[A-Z]|_)+$/g.test(argv.t)
    )
        pciIdentifier = argv.t;

    let dir_in = "./tmp";

    try {
        const options = {
            from: /ibTaoConnector\//g,
            // to: pciIdentifier,
            to: pciIdentifier + "/",
            countMatches: true,
            files: [
                path.join(dir_in, "imsPciCreator.js"),
                path.join(dir_in, "creator", "widget", "Widget.js"),
                path.join(dir_in, "creator", "widget", "states", "Question.js"),
                path.join(dir_in, "creator", "widget", "states", "states.js"),
                path.join(dir_in, "runtime", "ibTaoConnector.js"),
                path.join(dir_in, "runtime", "js", "itemManager.js"),
                path.join(dir_in, "runtime", "js", "renderer.js"),
            ],
        };
        replace.sync(options);

        replace.sync({
            from: /return 'ibTaoConnector/,
            to: "return '"+pciIdentifier,
            files: [
                path.join(dir_in, "runtime", "ibTaoConnector.js")                
            ]
        });

        replace.sync({
            from: /_typeIdentifier = 'ibTaoConnector/,
            to: "_typeIdentifier = '"+pciIdentifier,
            files: [
                path.join(dir_in, "imsPciCreator.js"),
            ]
        });
    }
        catch (error) {
        throw new Error("error replacing identifiers in pci codebase: " + error.message);
    }


//Mediafiles
    let pciCreatorFile = "./tmp/imsPciCreator.json";
    let pciCreator = JSON.parse(fs.readFileSync(pciCreatorFile));
    let basepath = "./tmp/runtime/assets/ee";
    let files = getFileList(basepath, "tmp/");
    pciCreator["runtime"]["src"] = pciCreator["runtime"]["src"].concat(files);

//Label & identifier
    let label = "";
    if(
        !!argv.l &&
        argv.l.length > 3 &&
        argv.l.length <= 64
    )
        label = argv.l;

    pciCreator["typeIdentifier"] = pciIdentifier;
    pciCreator["label"] = !!label ? label : pciCreator["label"];
    pciCreator["short"] = !!label ? label : pciCreator["short"];
    fs.writeFileSync(pciCreatorFile, JSON.stringify(pciCreator));

    
//item cfg
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
pciZip.addLocalFolder(("./tmp"));

let outpath = fs.existsSync(argv.o) ? argv.o : "./";
let zipfile = path.join(outpath, "ibTaoSpecificIMS.zip");
console.log("creating "+zipfile)
pciZip.writeZip(zipfile);

process.exit();

