import {
  trigger,
  transition,
  style,
  animate,
  query,
  animateChild,
} from '@angular/animations';

/**
 * Page entrance animation - fade in with slight upward slide
 * Lightweight and fast for polished feel
 */
export const pageEntranceAnimation = trigger('pageEntrance', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(20px)',
    }),
    animate(
      '300ms ease-out',
      style({
        opacity: 1,
        transform: 'translateY(0)',
      }),
    ),
  ]),
]);

/**
 * Card entrance animation - staggered fade in with upward slide
 * For multiple cards/sections on a page
 */
export const cardEntranceAnimation = trigger('cardEntrance', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(15px)',
    }),
    animate(
      '250ms ease-out',
      style({
        opacity: 1,
        transform: 'translateY(0)',
      }),
    ),
  ]),
]);

/**
 * Router outlet animation for page transitions
 */
export const routerTransition = trigger('routerTransition', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({
          opacity: 0,
          transform: 'translateY(20px)',
        }),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [
        animate(
          '200ms ease-in',
          style({
            opacity: 0,
          }),
        ),
      ],
      { optional: true },
    ),
    query(
      ':enter',
      [
        animate(
          '300ms 100ms ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);
