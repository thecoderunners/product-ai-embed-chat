## How to run dev mode

0. `pnpm i` or `npm i` (if no `pnpm` can use `npm` as well)
1. `pnpm run dev && pnpm run server`

## how to prod mode

1. `pnpm run build` to build the `dist` folder. it will read from vite.config.js and bundle the code
2. `pnpm run server`
3. `http-server .` (use `npm i -g http-server` if not installed)
4. go to `localhost:8080/index-prod` and view the code with the chatboxloaded.
