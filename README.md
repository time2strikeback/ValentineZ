# ValentineZ 💘

A playful single-page "Will you be my Valentine?" card. The **No** button runs away
from the cursor, and **Yes** sets off a burst of confetti.

**Live demo:** https://time2strikeback.github.io/ValentineZ/

## Personalise it

Add a name to the link:

```
https://time2strikeback.github.io/ValentineZ/?name=Alex
```

The name is cleaned up and shortened to 32 characters before it's shown. To change the
default name or the sender, edit `DEFAULT_NAME` and `VALENTINE_OF` at the top of `script.js`.

## Built with

- Plain HTML, CSS and JavaScript. No build step.
- An inline SVG illustration.
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for the celebration.
- Respects `prefers-reduced-motion`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server
```
