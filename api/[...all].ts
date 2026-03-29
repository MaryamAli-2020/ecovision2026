let appPromise:
  | Promise<ReturnType<(typeof import("../backend/src/app.js"))["createApp"]>>
  | undefined;

export default async function handler(request: unknown, response: unknown) {
  if (!appPromise) {
    appPromise = import("../backend/src/app.js").then(({ createApp }) => createApp());
  }

  const app = await appPromise;
  return app(request, response);
}
