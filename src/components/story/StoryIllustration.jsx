import React from 'react';

// Map each story scene to its corresponding illustration image
const SCENE_IMAGES = {
  'party-setup':    '/ChatGPT Image Jun 22, 2026, 03_20_16 PM.png',
  'equal-groups':   '/ChatGPT Image Jun 22, 2026, 02_32_01 PM.png',
  'skip-counting':  '/ChatGPT Image Jun 22, 2026, 02_34_37 PM.png',
  'celebration':    '/ChatGPT Image Jun 22, 2026, 02_50_45 PM.png',
};

const SCENE_LABELS = {
  'party-setup':   'Aisha setting up 5 party tables with 4 friends each',
  'equal-groups':  '5 tables with 4 chairs each — 5 equal groups of 4',
  'skip-counting': 'Skip counting by 4s: 4, 8, 12, 16, 20',
  'celebration':   '5 tables, 4 chairs each, makes 20 chairs altogether',
};

export default function StoryIllustration({ scene, title }) {
  const imgSrc = SCENE_IMAGES[scene] || SCENE_IMAGES['party-setup'];
  const altText = SCENE_LABELS[scene] || title || 'Story illustration';

  return (
    <div
      className="story-illustration"
      role="img"
      aria-label={altText}
    >
      <img
        src={imgSrc}
        alt={altText}
        className="story-illustration__img"
        draggable={false}
      />
    </div>
  );
}
