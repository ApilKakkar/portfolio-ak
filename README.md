# portfolio-ak

Landing page for apilkakkar.com. Plain HTML/CSS cards, with a light React Three Fiber
background (floating spheres that react to the cursor and scroll). The 3D layer is
lazy-loaded and skipped for reduced-motion users or browsers without WebGL.

## Add / edit projects
Edit `public/projects.js`.

## Run locally
    npm install
    npm run dev          # http://localhost:5173

## Docker
    docker compose up -d --build     # serves on :80
