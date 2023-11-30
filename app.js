document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  console.log(hash);
  if (hash == '#mouth') {
    document.title = 'MOUTH';
    drawCanvas('mouth');
    return;
  }

  if (hash == '#leftEye') {
    document.title = 'LEFT EYE';
    drawCanvas('leftEye');
    return;
  }

  if (hash == '#rightEye') {
    document.title = 'RIGHT EYE';
    drawCanvas('rightEye');
    return;
  }

  if (hash == '#nose') {
    document.title = 'NOSE';
    drawCanvas('nose');
    return;
  }

  start.addEventListener('click', async () => {
    await initFaceTracking();

    const getWindowFeatures = (x, y, width, height) => {
      return csv({
        popup: true,
        width,
        height,
        left: Math.floor(window.screen.availWidth / 2 - width / 2) + x,
        top: Math.floor(window.screen.availHeight / 2 - height / 2) + y,
      });
    }

    window.open('#leftEye', 'leftEye', getWindowFeatures(-250, 0, 250, 250));
    window.open('#rightEye', 'rightEye', getWindowFeatures(250, 0, 250, 250))
    window.open('#mouth', 'mouth', getWindowFeatures(0, 250, 750, 250));
    window.open('#nose', 'nose', getWindowFeatures(0, 0, 250, 250));
  });
});

function csv(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

async function drawCanvas(name) {
  const videoEl = await setupWebcam();
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );
  const ctx = canvas.getContext('2d');

  const loop = () => {

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;


    const box = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(name));
      } catch {
        return null;
      }
    })();
    if (box) {
      console.log(box)
      ctx.drawImage(
        videoEl,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
    requestAnimationFrame(loop);
  };

  loop();
}

async function setupWebcam() {
  const videoEl = /** @type {HTMLVideoElement} */ (
    document.getElementById('webcam')
  );

  const stream = await navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .catch((err) => {
      console.error(err);
      alert('To play, please enable camera access in your browser settings');
    });

  if (!stream) return;
  videoEl.srcObject = stream;

  videoEl.width = 800;
  videoEl.height = 600;

  return videoEl;
}

const model = faceapi.nets.tinyFaceDetector;

async function initFaceTracking() {
  const videoEl = await setupWebcam();
  await faceapi.loadFaceLandmarkModel('/models');
  await model.load('/models');

  const loop = async () => {
    const result = await detectFace(videoEl);

    if (!result) {
      requestAnimationFrame(loop);
      return;
    }



    const mouthBox = getBoundingBox(result.landmarks.getMouth());
    window.localStorage.setItem('mouth', JSON.stringify(mouthBox));

    const noseBox = getBoundingBox(result.landmarks.getNose());
    window.localStorage.setItem('nose', JSON.stringify(noseBox));

    const leftEyeBox = getBoundingBox(result.landmarks.getLeftEye());
    window.localStorage.setItem('leftEye', JSON.stringify(leftEyeBox));

    const rightEyeBox = getBoundingBox(result.landmarks.getRightEye());
    window.localStorage.setItem('rightEye', JSON.stringify(rightEyeBox));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function getBoundingBox(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  return { x, y, width, height };
}

/**
 * @param {HTMLVideoElement} videoEl
 */
async function detectFace(videoEl) {
  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded()) {
    return;
  }

  const options = getFaceDetectorOptions();

  let result = await faceapi
    .detectSingleFace(videoEl, options)
    .withFaceLandmarks();

  if (result) {
    // result = resizeCanvasAndResults(result, videoEl);
  }

  return result;
}

function getFaceDetectorOptions() {
  const inputSize = 512;
  const scoreThreshold = 0.5;
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

function isFaceDetectionModelLoaded() {
  return !!model.params;
}
