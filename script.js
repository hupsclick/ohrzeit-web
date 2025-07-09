let audioContext;
let inputGainNode;
let outputGainNode;
let stream;
let filters = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volume');
const volumeIndicator = document.querySelector('.volume-indicator');
const statusText = document.getElementById('status');
// Falls speechEnhance und trebleEnhance existieren (aus deinem ursprünglichen testhoerge.html)
const speechEnhance = document.getElementById('speechEnhance');
const trebleEnhance = document.getElementById('trebleEnhance');

// Audiogramm-Definition (optimierte Werte, synchron mit deinem aktuellen Code)
const audiogram = [
    { frequency: 250, gain: 10 },
    { frequency: 500, gain: 10 },
    { frequency: 1000, gain: 8 },
    { frequency: 2000, gain: 20 },
    { frequency: 4000, gain: 0 },
    { frequency: 8000, gain: 0 }
];

// Funktion zur manuellen Kopfhörer-Bestätigung
function confirmHeadphones() {
    return new Promise((resolve) => {
        if (confirm('Sind Kopfhörer angeschlossen? Dies ist erforderlich, um Rückkopplung zu vermeiden.')) {
            resolve(true);
        } else {
            statusText.textContent = 'Audio wird nicht gestartet. Bitte schließen Sie Kopfhörer an.';
            resolve(false);
        }
    });
}

async function startAudio() {
    console.log('startAudio called');
    console.log('Kein Testton wird abgespielt, nur Mikrofon-Pipeline wird gestartet');

    if (!navigator.onLine) {
        statusText.textContent = 'Offline. Audio nicht verfügbar.';
        return;
    }

    const hasHeadphones = await confirmHeadphones();
    if (!hasHeadphones) {
        return;
    }

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
        console.log('AudioContext erstellt, Zustand:', audioContext.state);
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext nach resume:', audioContext.state);
        }

        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 48000,
                channelCount: 1,
                noiseSuppression: false,
                echoCancellation: false,
                autoGainControl: false
            }
        });
        console.log('Mikrofonzugriff erfolgreich, Stream:', stream);

        const source = audioContext.createMediaStreamSource(stream);
        inputGainNode = audioContext.createGain();
        inputGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        console.log('inputGainNode erstellt, Gain:', inputGainNode.gain.value);

        // Filter mit audiogram-Werten initialisieren
        filters = audiogram.map(({ frequency, gain }) => {
            const filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
            filter.gain.setValueAtTime(gain, audioContext.currentTime);
            filter.Q.setValueAtTime(1.0, audioContext.currentTime);
            console.log(`Filter für ${frequency}Hz erstellt, Gain: ${gain}`);
            return filter;
        });

        // Compressor zur Vermeidung von Verzerrungen
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);

        outputGainNode = audioContext.createGain();
        outputGainNode.gain.setValueAtTime(volumeSlider.value || 1.0, audioContext.currentTime);
        console.log('outputGainNode erstellt, Gain:', outputGainNode.gain.value);

        // Audio-Routing
        source.connect(inputGainNode);
        inputGainNode.connect(filters[0]);
        for (let i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }
        filters[filters.length - 1].connect(compressor);
        compressor.connect(outputGainNode);
        outputGainNode.connect(audioContext.destination);

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline';
        statusText.textContent = 'Audio läuft...';
        statusText.classList.add('warning');
        console.log('Volume gesetzt:', volumeSlider.value);
        updateVolumeIndicator();

        // Listener für speechEnhance und trebleEnhance (falls vorhanden)
        if (speechEnhance) {
            speechEnhance.addEventListener('input', () => {
                const filter = filters.find(f => f.frequency.value === 2000);
                if (filter) {
                    filter.gain.setValueAtTime(speechEnhance.value * 20, audioContext.currentTime);
                    console.log('Sprachverstärkung (2000 Hz) gesetzt:', filter.gain.value);
                }
            });
        }
        if (trebleEnhance) {
            trebleEnhance.addEventListener('input', () => {
                const filter4000 = filters.find(f => f.frequency.value === 4000);
                const filter8000 = filters.find(f => f.frequency.value === 8000);
                if (filter4000 && filter8000) {
                    filter4000.gain.setValueAtTime(trebleEnhance.value * 12, audioContext.currentTime);
                    filter8000.gain.setValueAtTime(trebleEnhance.value * 12, audioContext.currentTime);
                    console.log('Höhenverstärkung (4000/8000 Hz) gesetzt:', filter4000.gain.value);
                }
            });
        }
    } catch (err) {
        statusText.textContent = 'Fehler beim Zugriff auf das Mikrofon: ' + err.message;
        statusText.classList.add('warning');
        console.error('Mikrofonfehler:', err);
    }
}

function stopAudio() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    startBtn.style.display = 'inline';
    stopBtn.style.display = 'none';
    statusText.textContent = 'Audio gestoppt.';
    statusText.classList.remove('warning');
}

const updateVolumeIndicator = () => {
    const volumeValue = Math.round((volumeSlider.value / volumeSlider.max) * 100);
    volumeIndicator.textContent = `${volumeValue}%`;
    const percentage = (volumeSlider.value / volumeSlider.max) * 100;
    volumeIndicator.style.left = `calc(${percentage}% - 25px)`;
    if (outputGainNode) {
        outputGainNode.gain.setValueAtTime(volumeSlider.value, audioContext.currentTime);
        console.log('Volume gesetzt:', volumeSlider.value);
    }
    localStorage.setItem('volumeSetting', volumeSlider.value); // Speichert den Slider-Wert
};

volumeSlider.addEventListener('input', updateVolumeIndicator);

// Funktion zum Laden und Speichern der Einstellungen
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('audiogramSettings')) || audiogram;
    document.querySelectorAll('.freq-slider').forEach((slider, index) => {
        const savedGain = savedSettings[index]?.gain || audiogram[index].gain;
        slider.value = savedGain;
        const indicatorId = `indicator-${slider.dataset.freq}`;
        const indicator = document.getElementById(indicatorId);
        const percentage = ((savedGain - slider.min) / (slider.max - slider.min)) * 100;
        indicator.textContent = `${Math.round(savedGain)} dB`;
        indicator.style.left = `calc(${percentage}% - 25px)`;
    });
}

document.querySelectorAll('.freq-slider').forEach((slider, index) => {
    const indicatorId = `indicator-${slider.dataset.freq}`;
    const indicator = document.getElementById(indicatorId);
    slider.addEventListener('input', () => {
        const freq = parseInt(slider.dataset.freq);
        const gain = parseFloat(slider.value);
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        indicator.textContent = `${Math.round(gain)} dB`;
        indicator.style.left = `calc(${percentage}% - 25px)`;

        console.log(`Regler ${freq}Hz auf ${gain}dB gesetzt`);
        if (freq === 250) {
            console.log('250 Hz Regler bewegt, Slider-Wert:', slider.value);
        }

        const filter = filters.find(f => f.frequency.value === freq);
        if (filter) {
            filter.gain.setValueAtTime(gain, audioContext.currentTime);
        }

        // Speichern der Einstellungen
        const updatedSettings = audiogram.map((item, i) => ({
            frequency: item.frequency,
            gain: parseFloat(document.querySelector(`.freq-slider[data-freq="${item.frequency}"]`)?.value || item.gain)
        }));
        localStorage.setItem('audiogramSettings', JSON.stringify(updatedSettings));

        // Aktualisiere audiogram
        audiogram[index].gain = gain;
    });
});

// Einstellungen beim Laden initialisieren
window.addEventListener('load', () => {
    loadSettings();
    volumeSlider.value = localStorage.getItem('volumeSetting') || 1.0; // Standardwert 1.0 (20%)
    updateVolumeIndicator();
});

// Audio-Start und -Stop Buttons hinzufügen
startBtn.addEventListener('click', startAudio);
stopBtn.addEventListener('click', stopAudio);

// Service Worker Registrierung
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      console.log('Service Worker registriert mit Scope:', reg.scope);
    }).catch(function(error) {
      console.error('Fehler beim Registrieren des Service Workers:', error);
    });
  });
}


// Tastatur Belegung für Navigation
document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    if (key === 'o') {
        window.location.href = 'testhoerge.html'; // Korrigiert von index.html
    } else if (key === 'i') {
        window.location.href = 'impressum.html';
    } else if (key === 'd') {
        window.location.href = 'datenschutz.html';
    } else if (key === 'escape') {
        window.history.back();
    }
});