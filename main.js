
const https = require('https');
const ytDl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs')
var Jimp = require('jimp');
const got = require('got');
const uuid = require('uuid');

// constants
const dumpFolder = __dirname + 'dumps/';
const spBaseImg = 'watermark images/sp.png';
const vidExtension = '.mp4';

const retRes = () => console.log('finished execution');
const logErr = error => console.error(error);

// Add dumps if required
// if (!fs.existsSync(dumpFolder)){
//   fs.mkdirSync(dumpFolder);
// }
console.log(__dirname);


async function ytVideoGet(url) {
  try {
    info = await ytDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      referer: 'https://example.com'
    });
    
    return info;
  } catch (error) {
   logErr(error);
   return {}; 
  }
}

function videoResize(info) {
  var id = uuid.v4();
  const vidName = 'vid-' + id + vidExtension;
  const currentVidPath = dumpFolder + id + '/'; 

  if (!fs.existsSync(currentVidPath)){
    fs.mkdirSync(currentVidPath);
  }
  console.log('currentVidPath:', currentVidPath);

  return new Promise((resolve, reject) => { 
    ffmpeg()
      .input(got.stream(info.videoUrl))
      // .videoCodec('H264')
      .size('720x?')
      .aspect('9:16')
      .autopad()
      .on('end', () => {
        console.log(vidName, 'completed');
        resolve({
          id: id,
          name: vidName
        });
      })
      .on('error', (err) => {
        console.error(vidName, 'failed with ERROR:', err);
        reject(new Error(err));
      })
      .save(currentVidPath + vidName);
  });
}

function videoOverlay(vidInfo, imageName, info) {
  const outVidName = 'out-' + vidInfo.name;
  const currentVidPath = dumpFolder + vidInfo.id + '/'; 
  return new Promise((resolve, reject) => {
    ffmpeg(currentVidPath + vidInfo.name)
      .input(got.stream(info.audioUrl))
      .input(currentVidPath + imageName)
      // .audioCodec('aac')
      .complexFilter([
        'overlay=W/2-w/2:H-h-100'
      ])
      .on('end', () => {
        console.log(outVidName, 'completed');
        resolve({
          id: vidInfo.id,
          name: outVidName
        });
      })
      .on('error', (err) => {
        console.error(outVidName, 'failed with ERROR:', err);
        reject(new Error(err));
      })
      .save(currentVidPath + outVidName);
  });
}

async function overlayInfo(info) {
  try {
    var vidTmp = await videoResize(info);
      
    console.log('starting text processing');
    
    var image = await Jimp.read(spBaseImg);
    var font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
    var imageName = 'img-' + vidTmp.id + '.png';
    var imageFinal = await image
      .print(font, 15, 54, info.owner)
      .write(dumpFolder + vidTmp.id + '/' + imageName);
    
    var videoFinal = await videoOverlay(vidTmp, imageName, info);
  
    console.log(videoFinal.name, 'processed successfully');
    return dumpFolder + vidTmp.id + '/' + videoFinal.name;
  } catch (error) {
    logErr(error);
    return error;
  }
}

async function beginVideo(url) {
  info = await ytVideoGet(url);
  vid = await overlayInfo({
    'owner': info.channel,
    'videoUrl': info.requested_formats[0].url,
    'audioUrl': info.requested_formats[1].url
  });
  return vid;
}

const 
  // videoUrl = 'https://www.youtube.com/watch?v=R1EwKwayzLM';
  // videoUrl = 'https://www.youtube.com/watch?v=9PugD11k3JU';
  videoUrl = 'https://youtu.be/R1EwKwayzLM';
// var vid = beginVideo(videoUrl).then((res) => console.log('Promise resolved with', res));


module.exports = {
  beginVideo: beginVideo
};