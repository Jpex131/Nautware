import { initNavigation } from './ui/navigation.js';
import { initShowcase } from './ui/showcase.js';
import { initAudioPlayer } from './ui/audioPlayer.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initShowcase();
    initAudioPlayer();
});
