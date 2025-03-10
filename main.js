
const https = require('https');
const ytDl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs')
var Jimp = require('jimp');
const got = require('got');
const uuid = require('uuid');
const path = require('path');

// constants
const publicFolder = path.join(__dirname, 'public');
const dumpFolder = path.join(publicFolder, 'dumps');
const spBaseImg = path.join('watermark images', 'spf_transparent.png');
const vidExtension = '.mp4';

const retRes = () => console.log('finished execution');
const logErr = error => console.error(error);

// Add dumps if required
if (!fs.existsSync(dumpFolder)){
  fs.mkdirSync(dumpFolder);
}
console.log(dumpFolder);


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
    
    return {
      'owner': info.channel,
      'videoUrl': info.requested_formats[0].url,
      'audioUrl': info.requested_formats[1].url
    };
  } catch (error) {
   logErr(error);
   return {}; 
  }
}

function videoResize(info) {
  var id = uuid.v4();
  const vidName = 'vid-' + id + vidExtension;
  const currentVidPath = path.join(dumpFolder, id); 

  if (!fs.existsSync(currentVidPath)){
    fs.mkdirSync(currentVidPath);
  }
  console.log('currentVidPath:', currentVidPath);

  return new Promise((resolve, reject) => { 
    ffmpeg()
      .input(got.stream(info.videoUrl))
      // .videoCodec('H264')
      .size('480x?')
      // .aspect('9:16')
      // .autopad()
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
      .save(path.join(currentVidPath, vidName));
  });
}

function videoOverlay(vidInfo, imageName, info) {
  const outVidName = 'out-' + vidInfo.name;
  const currentVidPath = path.join(dumpFolder, vidInfo.id); 
  return new Promise((resolve, reject) => {
    ffmpeg(path.join(currentVidPath, vidInfo.name))
      .input(got.stream(info.audioUrl))
      .input(path.join(currentVidPath, imageName))
      // .audioCodec('aac')
      .complexFilter([
        'overlay=W/2-w/2:H-h'
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
      .save(path.join(currentVidPath, outVidName));
  });
}

async function overlayInfo(info) {
  try {
    var vidTmp = await videoResize(info);
      
    console.log('starting text processing');
    const SP_YT_TEXT = 'shareplus.com                            YouTube';
    var font1 = await Jimp.loadFont(path.join(__dirname, 'SPFONT14PX', 'Unnamed.fnt'));
    var font2 = await Jimp.loadFont(path.join(__dirname, 'SPFONT32PX', 'Unnamed.fnt'));
    var imageTmpName = 'img-tmp-' + vidTmp.id + '.png';
    var image = await Jimp.read(spBaseImg);
    var imageTmpStatus = await new Promise((resolve, reject) => { 
      image
        .print(font1, 15, 0, SP_YT_TEXT)
        .write(path.join(dumpFolder, vidTmp.id, imageTmpName), () => resolve(true));
    });
    
    var imageName = 'img-' + vidTmp.id + '.png';
    var imageTmp = await Jimp.read(path.join(dumpFolder, vidTmp.id, imageTmpName));
    var imageFinalStatus = await new Promise((resolve, reject) => {
      imageTmp
        .print(font2, 15, 15, info.owner)
        .write(path.join(dumpFolder, vidTmp.id, imageName), () => resolve(true));
    });
      
    var videoFinal = await videoOverlay(vidTmp, imageName, info);
  
    console.log(videoFinal.name, 'processed successfully');
    // return path.join(dumpFolder, vidTmp.id, videoFinal.name);
    return path.join('dumps', vidTmp.id, videoFinal.name);
  } catch (error) {
    logErr(error);
    return error;
  }
}

async function beginVideo(url) {
  info = await ytVideoGet(url);
  vid = await overlayInfo(info);
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