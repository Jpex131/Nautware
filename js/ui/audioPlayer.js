export function initAudioPlayer() {
    // --- AUDIO PLAYER LOGIC ---
    const tracks = [
        { title: "A QUIET ORBIT", artist: "NAUT AUDIO SYSTEMS", src: "assets/audio/A_Quiet_Orbit.mp3" },
        { title: "THE FINAL NEBULA HYMN", artist: "NAUT AUDIO SYSTEMS", src: "assets/audio/The_Final_Nebula_Hymn.mp3" }
    ];
    let currentTrackIndex = 0;

    const audioEl = document.getElementById('bg-audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const eqVisualizer = document.querySelector('.eq-visualizer');
    const trackTitleEl = document.getElementById('track-title-el');
    const trackArtistEl = document.getElementById('track-artist-el');

    if (!audioEl || !playPauseBtn) return;

    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');

    function loadTrack(index) {
        trackTitleEl.textContent = tracks[index].title;
        trackArtistEl.textContent = tracks[index].artist;
        audioEl.src = tracks[index].src;
        audioEl.load();
    }

    function togglePlayPause() {
        if (audioEl.paused) {
            audioEl.play().catch(e => console.error("Playback failed:", e));
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            eqVisualizer.classList.add('playing');
        } else {
            audioEl.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            eqVisualizer.classList.remove('playing');
        }
    }

    playPauseBtn.addEventListener('click', togglePlayPause);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
            const wasPlaying = !audioEl.paused;
            loadTrack(currentTrackIndex);
            if (wasPlaying) {
                audioEl.play().catch(e => console.error("Playback failed:", e));
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                eqVisualizer.classList.remove('playing');
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
            const wasPlaying = !audioEl.paused;
            loadTrack(currentTrackIndex);
            if (wasPlaying) {
                audioEl.play().catch(e => console.error("Playback failed:", e));
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                eqVisualizer.classList.remove('playing');
            }
        });
    }

    audioEl.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        audioEl.play().catch(e => console.error("Playback failed:", e));
    });
}
