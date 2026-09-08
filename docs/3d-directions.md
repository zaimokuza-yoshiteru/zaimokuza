# Direction A: illustrated companions and subtle depth

The warm beige layout uses restrained pointer tilt and interactive layered SVG characters.

- Projects: Bugcat Capoo is redrawn with a broad face, sky-blue fill, thick dark outline, large oval eyes, small legs and back stripes. Reference: https://ip.taicca.tw/ip/show/1888 and https://www.bugcatcapoo.com/about . A click triggers a small hop and blush.
- Experience: Bongo Cat sits beside the heading with raised paws and two bongos. Reference: https://bongo.cat/ (art credited there to StrayRogue; meme by DitzyFlama). Clicking triggers alternating drum hits, with no audio.
- Both illustrations are drawn locally in SVG. Gentle CSS perspective, separate moving parts and ground shadows provide the 2.5D effect. No downloaded character assets, model files, texture requests or Three.js dependency are used.
- The hero uses one continuous quote paragraph with consistent type size and weight. Identity and location remain small header text; source contains only the work title and year. Chinese wording remains unchanged, with the English translation shown in the pointer mask.
- Project cards keep repository names and Chinese use-case descriptions. The theme-library experiment remains last. The footer orbit remains removed.

## Runtime and accessibility

The shared useMascot hook pauses CSS animation outside the viewport and while the page is hidden. Native buttons support touch, Enter and Space; feedback is announced politely. Reduced motion disables transforms and animation while retaining text feedback. No global keyboard interception or sound playback is added. Text, repository links and dynamic Stars remain independent. Public assets use import.meta.env.BASE_URL for GitHub Pages.

## Optional later directions

B: an engineering laboratory with restrained cyan highlights and precise grid details.

C: a miniature desk scene linking the globe, character and project archive through a consistent spatial composition.
