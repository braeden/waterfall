const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
c.width = 50;
c.height = 50;

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

loadImage('img/fingerprint.svg')

document.getElementById('canvas').addEventListener('click', () => {
    const audioContainer = new AudioContext();
    const startTime = audioContainer.currentTime;
    const rowLength =  parseFloat(document.getElementById('rowLength')?.value) || .15;
    for (let y = c.height; y > 0; y--) {
        const row = ctx.getImageData(0, y, c.width, 1);
        const {
            data
        } = row
        const notes = []
        for (var i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const oscil = audioContainer.createOscillator();
            const gain = audioContainer.createGain();
            oscil.type = 'sine';
            oscil.frequency.value = mapRange(i, data.length, 7500) + 12500;
            oscil.connect(gain);
            gain.connect(audioContainer.destination);
            gain.gain.value = mapRange(avg, 255, 1)
            notes.push(oscil);
        }
        const startOffset = rowLength * (c.height - y);
        notes.forEach(e => {
            e.start(startTime + startOffset);
            e.stop(startTime + startOffset + rowLength)
        });
    }
})