import { Domain } from './types';

// PLACEHOLDER copy - generic, short "why this matters" blurbs so the Domain
// Detail screen's Learn More section has somewhere to render real content
// once it's authored (Stage 5 in ARCHITECTURE.md's build order). Not meant
// to be shipped as final educational content.
export const DOMAIN_LEARN_MORE: Partial<Record<Domain, { title: string; body: string }>> = {
  Sleep: {
    title: 'Why Sleep matters',
    body: 'Consistent sleep is the foundation everything else in the Reset builds on - it affects mood, recovery, and how much willpower is left over for the rest of the day.',
  },
  Move: {
    title: 'Why Move matters',
    body: 'Regular movement rebuilds physical capacity and gives the day natural structure - it does not need to be intense to count.',
  },
  Fuel: {
    title: 'Why Fuel matters',
    body: 'Eating with some regularity and intention supports energy and focus - this is about consistency, not any particular diet.',
  },
  Connect: {
    title: 'Why Connect matters',
    body: 'A little real, phone-free contact with another person each week keeps the Reset from becoming an isolated project.',
  },
  Build: {
    title: 'Why Build matters',
    body: 'Protected time for something that is yours - a hobby, a project, a skill - gives the free time gaming used to fill somewhere real to go.',
  },
  Live: {
    title: 'Why Live matters',
    body: 'Ordinary life - errands, family time, unplanned moments - still counts. This domain exists so a normal day is not treated as a gap in the plan.',
  },
};
