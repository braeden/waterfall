const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
c.width = 50;
c.height = 50;
const freqCenter = 12500
const freqRange = 7500;

const mapRange = (n, old, updated) => updated / old * n;

const loadImage = (e) => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, c.width, c.height)
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, c.width, c.height);
    }
    img.src = e?.target?.result || e;
}

document.getElementById('upload').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = loadImage
    reader.readAsDataURL(e.target.files[0]);
})

loadImage('img/heart.svg')

document.getElementById('startAudio').addEventListener('click', () => {
    const audioContainer = new AudioContext();
    const startTime = audioContainer.currentTime;
    const rowLength = parseFloat(document.getElementById('rowLength')?.value) || .15;
    for (let y = c.height; y > 0; y--) {
        const row = ctx.getImageData(0, y, c.width, 1);
        const { data } = row;
        const notes = [];
        for (var i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const oscil = audioContainer.createOscillator();
            const gain = audioContainer.createGain();
            oscil.type = 'sine';
            oscil.frequency.value = mapRange(i, data.length, freqRange) + freqCenter;
            oscil.connect(gain);
            gain.connect(audioContainer.destination);
            gain.gain.value = mapRange(avg, 255, 1)
            notes.push(oscil);
        }
        const startOffset = rowLength * (c.height - y);
        notes.forEach(e => {
            e.start(startTime + startOffset);
            e.stop(startTime + startOffset + rowLength);
        });
    }
});


document.getElementById('startWaterfall').addEventListener('click', async () => {
    try {
        const audioContainer = new AudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const analyser = audioContainer.createAnalyser();
        const source = audioContainer.createMediaStreamSource(stream)
        analyser.fftSize = 16384;
        analyser.smoothingTimeConstant = 0;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);
        const spectrogram = document.getElementById('spectrogram')
        const spectrogramCtx = spectrogram.getContext('2d')

        spectrogram.height = bufferLength / 16;
        spectrogram.width = bufferLength / 16;
        spectrogramCtx.clearRect(0, 0, spectrogram.width, spectrogram.height);

        let row = spectrogram.height;
        (function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            const pixelWidth = (spectrogram.width / bufferLength);
            // Todo: keep a rolling max? + shrink freq spectrum disaplyed
            for (let i = 0, x = 0; i < bufferLength; i++, x += pixelWidth) {
                spectrogramCtx.fillStyle = `hsl(${255 - dataArray[i] * 2}, 100%, 50%)`
                spectrogramCtx.fillRect(x, row, 1, 1);
            }
            row = row - 1 || spectrogram.height;
        })();
    } catch (e) {
        console.error(e)
        alert(e)
    }
});