const sharp = require('sharp');
const sizeOf = require('image-size');
const jimp = require('jimp');

const FILE_TYPE = '.png';
const INPUT = 'input/cubemap' + FILE_TYPE;
const OUTPUT_FP = '../public/img/skybox/';

const OUTPUT_MAP = {
    "01" : "py",
    "10" : "nx",
    "11" : "pz",
    "12" : "px",
    "13" : "nz",
    "21" : "ny",
} as any;

const main = async () => {
    let side = (await sizeOf(INPUT)).width / 4;
    for(var y = 0; y < 3; y++){
        for(var x = 0; x < 4; x++){
            let fp = OUTPUT_MAP[`${y}${x}` as any];
            let fullFP = OUTPUT_FP + fp + FILE_TYPE;
            if(fp) {
                sharp(INPUT).extract({ width: side, height: side, left: ( x * side ), top: ( y * side ) }).toFile(fullFP);
            }
        }
    }
}

main();