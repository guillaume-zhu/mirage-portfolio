import './styles/main.css';
import { initAnimations } from './animations';
import { createFooterWebGL } from './footerWebGL';

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();

    const footerEl = document.querySelector('#footer');
    if (footerEl) {
        createFooterWebGL(footerEl);
    }
});
