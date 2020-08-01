const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
c.width = 50;
c.height = 50;
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, c.width, c.height)
const img = new Image();
img.src = 'img/fingerprint.svg'

const mapRange = (n, old, updated) => updated / old * n;
img.onload = () => {
    ctx.drawImage(img, 0, 0, c.width, c.height);
}

document.getElementById('canvas').addEventListener('click', () => {
    const audioContainer = new AudioContext();
    const startTime = audioContainer.currentTime;
    for (let y = c.height; y > 0; y--) {
        const row = ctx.getImageData(0, y, c.width, 1);
        const {
            data
        } = row
        const grayscale = []
        const notes = []
        for (var i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            grayscale.push(avg);
            const oscil = audioContainer.createOscillator();
            const gain = audioContainer.createGain();

            oscil.type = 'sine';
            oscil.frequency.value = mapRange(i, data.length, 7500) + 12500;
            oscil.connect(gain);
            gain.connect(audioContainer.destination);
            gain.gain.value = mapRange(avg, 255, 1)
            notes.push(oscil);
        }
        const lengthPerRow = .15;
        const startOffset = lengthPerRow * (c.height - y);
        console.time('Row: ', y)
        notes.forEach(e => {
            e.start(startTime + startOffset);
            e.stop(startTime + startOffset + lengthPerRow)
        });
        console.timeEnd('Row: ', y);
        
    }
})